import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";

async function getSmtpConfig() {
  const settings = await prisma.settings.findMany({
    where: {
      key: {
        in: ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from"],
      },
    },
  });

  const config = settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    host: config.smtp_host || process.env.SMTP_HOST,
    port: Number(config.smtp_port || process.env.SMTP_PORT || 587),
    secure: (config.smtp_secure || process.env.SMTP_SECURE) === "true",
    user: config.smtp_user || process.env.SMTP_USER,
    pass: config.smtp_pass ? decrypt(config.smtp_pass) : process.env.SMTP_PASS || "",
    from: config.smtp_from || process.env.SMTP_FROM || config.smtp_user || process.env.SMTP_USER,
  };
}

export async function isEmailConfigured(): Promise<boolean> {
  const config = await getSmtpConfig();
  return Boolean(config.host && config.user);
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<boolean> {
  if (!(await isEmailConfigured())) {
    console.log("[email] SMTP not configured, skipping password reset email to", to);
    return false;
  }

  try {
    const config = await getSmtpConfig();
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    await transporter.sendMail({
      from: config.from,
      to,
      subject: "Reset your Bismillah Bazaar password",
      text: `Reset your password using this link. It expires in 1 hour:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#059669">Bismillah Bazaar</h2>
          <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
          <p style="margin:24px 0">
            <a href="${resetUrl}" style="background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Reset Password</a>
          </p>
          <p>If the button doesn't work, copy and paste this URL into your browser:</p>
          <p style="word-break:break-all;font-size:12px;color:#52525b">${resetUrl}</p>
          <p style="font-size:12px;color:#71717a">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("[email] Failed to send password reset email:", error);
    return false;
  }
}

type DeliveryOrder = {
  id: string;
  originalTotal: any;
  finalTotal: any;
  requestedEta: Date | null;
  adminEta: Date | null;
  deliveredAt: Date | null;
  items: {
    requestedKg: any;
    fulfilledKg: any;
    item: { itemName: string };
  }[];
};

export async function sendDeliveryReceipt(
  to: string,
  order: DeliveryOrder
): Promise<boolean> {
  if (!(await isEmailConfigured())) {
    console.log("[email] SMTP not configured, skipping delivery receipt to", to);
    return false;
  }

  try {
    const config = await getSmtpConfig();
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    const finalTotal = Number(order.finalTotal ?? order.originalTotal).toFixed(2);
    const deliveredDate = order.deliveredAt
      ? order.deliveredAt.toLocaleDateString()
      : new Date().toLocaleDateString();

    const itemRows = order.items
      .map(
        (oi) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;font-size:14px">${oi.item.itemName}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;font-size:14px;text-align:center">${Number(oi.requestedKg)} kg</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;font-size:14px;text-align:center">${Number(oi.fulfilledKg ?? oi.requestedKg)} kg</td>
          </tr>`
      )
      .join("");

    await transporter.sendMail({
      from: config.from,
      to,
      subject: `Delivery Receipt — Order #${order.id.slice(0, 8)}`,
      text: `Your order has been delivered on ${deliveredDate}.\n\nItems:\n${order.items.map((oi) => `• ${oi.item.itemName}: ${Number(oi.fulfilledKg ?? oi.requestedKg)} kg`).join("\n")}\n\nTotal: $${finalTotal}\n\nThank you for ordering from Bismillah Bazaar.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff">
          <div style="background:#059669;padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">Bismillah Bazaar</h1>
            <p style="color:#d1fae5;margin:4px 0 0;font-size:14px">Delivery Receipt</p>
          </div>
          <div style="padding:24px">
            <p style="font-size:16px;margin:0 0 16px">Your order has been <strong style="color:#059669">delivered</strong> on ${deliveredDate}.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <thead>
                <tr style="background:#f4f4f5">
                  <th style="padding:8px 12px;text-align:left;font-size:12px;color:#52525b;text-transform:uppercase">Item</th>
                  <th style="padding:8px 12px;text-align:center;font-size:12px;color:#52525b;text-transform:uppercase">Requested</th>
                  <th style="padding:8px 12px;text-align:center;font-size:12px;color:#52525b;text-transform:uppercase">Fulfilled</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
            <div style="text-align:right;font-size:20px;font-weight:bold;color:#059669;margin:16px 0">
              Total: $${finalTotal}
            </div>
            <p style="font-size:12px;color:#71717a;margin-top:24px;text-align:center">
              Order #${order.id.slice(0, 8)} &middot; Thank you for ordering from Bismillah Bazaar
            </p>
          </div>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("[email] Failed to send delivery receipt:", error);
    return false;
  }
}
