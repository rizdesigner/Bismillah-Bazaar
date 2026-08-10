import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/reset-token";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });

    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const resetToken = await createPasswordResetToken(user.id);
    const resetUrl = `${req.nextUrl.origin}/reset-password?token=${resetToken}`;

    return NextResponse.json({ resetUrl });
  } catch (error) {
    console.error("Generate reset link error:", error);
    return NextResponse.json(
      { error: "Failed to generate reset link" },
      { status: 500 }
    );
  }
}
