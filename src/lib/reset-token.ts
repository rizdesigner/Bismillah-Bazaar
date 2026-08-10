import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createPasswordResetToken(
  userId: string
): Promise<string> {
  // Invalidate any previous unused tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId, usedAt: null },
  });

  const token = generateResetToken();
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  return token;
}

export async function validatePasswordResetToken(
  token: string
): Promise<boolean> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  return Boolean(
    record && !record.usedAt && record.expiresAt.getTime() >= Date.now()
  );
}

export async function consumePasswordResetToken(
  token: string
): Promise<string | null> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return null;
  }

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record.userId;
}
