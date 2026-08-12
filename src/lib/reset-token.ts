export const runtime = 'edge';

import crypto from "crypto";
import { createClient } from '@/lib/supabase-server';

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createPasswordResetToken(
  userId: string
): Promise<string> {
  const supabase = await createClient();

  await supabase
    .from('password_reset_tokens')
    .delete()
    .eq('user_id', userId)
    .is('used_at', null);

  const token = generateResetToken();
  await supabase
    .from('password_reset_tokens')
    .insert({
      user_id: userId,
      token_hash: hashToken(token),
      expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
    });

  return token;
}

export async function validatePasswordResetToken(
  token: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data: record } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token_hash', hashToken(token))
    .single();

  return Boolean(
    record && !record.used_at && new Date(record.expires_at).getTime() >= Date.now()
  );
}

export async function consumePasswordResetToken(
  token: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data: record } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token_hash', hashToken(token))
    .single();

  if (!record || record.used_at || new Date(record.expires_at).getTime() < Date.now()) {
    return null;
  }

  await supabase
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', record.id);

  return record.user_id;
}
