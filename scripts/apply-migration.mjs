import fs from 'fs';
import path from 'path';

const envLocalPath = path.join(process.cwd(), '.env.local');
const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');

const getEnvVar = (name) => {
  const match = envLocalContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase configuration in .env.local");
  process.exit(1);
}

const sqlMigration = fs.readFileSync(
  path.join(process.cwd(), 'prisma', 'migrations', '20260817000000_add_piece_sizes_and_chat', 'migration.sql'),
  'utf8'
);

async function applyMigration() {
  console.log('Applying migration to Supabase...\n');

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sqlMigration }),
  });

  if (response.ok) {
    console.log('✅ Migration applied successfully');
  } else {
    const errText = await response.text();
    console.error('❌ Migration failed:', response.status, errText);
    process.exit(1);
  }
}

applyMigration().catch(console.error);
