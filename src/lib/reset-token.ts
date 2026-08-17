import { createClient } from '@/lib/supabase-server';

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

async function sha256Hex(input: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateResetToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
  const hashHex = await sha256Hex(token);

  await supabase
    .from('password_reset_tokens')
    .insert({
      user_id: userId,
      token_hash: hashHex,
      expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
    });

  return token;
}

export async function validatePasswordResetToken(
  token: string
): Promise<boolean> {
  const supabase = await createClient();
  const hashHex = await sha256Hex(token);

  const { data: record } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token_hash', hashHex)
    .single();

  return Boolean(
    record && !record.used_at && new Date(record.expires_at).getTime() >= Date.now()
  );
}

export async function consumePasswordResetToken(
  token: string
): Promise<string | null> {
  const supabase = await createClient();
  const hashHex = await sha256Hex(token);

  const { data: record } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token_hash', hashHex)
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
