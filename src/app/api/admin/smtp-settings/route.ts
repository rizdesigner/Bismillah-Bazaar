import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });

    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from"],
        },
      },
    });

    const settingsMap = settings.reduce((acc, s) => {
      let value = s.value;
      if (s.key === "smtp_pass" && value) {
        try {
          value = decrypt(value);
          value = "••••••••" + value.slice(-4);
        } catch {
          value = "••••••••";
        }
      }
      acc[s.key] = value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("SMTP settings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });

    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, smtp_from } = await req.json();

    const updates = [
      { key: "smtp_host", value: smtp_host || "" },
      { key: "smtp_port", value: smtp_port || "587" },
      { key: "smtp_secure", value: smtp_secure ? "true" : "false" },
      { key: "smtp_user", value: smtp_user || "" },
      { key: "smtp_from", value: smtp_from || smtp_user || "" },
    ];

    if (smtp_pass && !smtp_pass.startsWith("••••••••")) {
      updates.push({ key: "smtp_pass", value: encrypt(smtp_pass) });
    }

    for (const update of updates) {
      await prisma.settings.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SMTP settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
