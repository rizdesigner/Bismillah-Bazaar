import nodemailer from "nodemailer";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.log("[email] SMTP not configured, skipping password reset email to", to);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || "",
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
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
