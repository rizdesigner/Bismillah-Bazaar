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

async function checkUsers() {
  const response = await fetch(`${supabaseUrl}/rest/v1/users?select=email,role,status,restaurant_name`, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`
    }
  });

  const users = await response.json();
  console.log('Users in database:\n');
  users.forEach(u => {
    console.log(`Email: ${u.email}`);
    console.log(`Role: ${u.role}`);
    console.log(`Status: ${u.status}`);
    console.log(`Restaurant: ${u.restaurant_name}`);
    console.log('---');
  });
}

checkUsers().catch(console.error);
