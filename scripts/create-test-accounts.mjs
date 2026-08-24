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

async function createTestAccount(email, password, role, restaurantName, phone, location, status = 'active') {
  // Step 1: Create auth user
  const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true
    })
  });

  if (!authResponse.ok) {
    const errText = await authResponse.text();
    console.error(`✗ Failed to create auth user ${email}: ${errText}`);
    return;
  }

  const authUser = await authResponse.json();
  const userId = authUser.id;

  // Step 2: Insert into public users table
  const profileResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      id: userId,
      email,
      role,
      restaurant_name: restaurantName,
      phone,
      location,
      status
    })
  });

  if (profileResponse.ok) {
    console.log(`✓ Created ${role} account: ${email} (password: ${password})`);
  } else {
    const errText = await profileResponse.text();
    console.error(`✗ Failed to create profile for ${email}: ${errText}`);
  }
}

async function main() {
  console.log('Creating test accounts...\n');
  
  // Admin account (already exists, skip)
  console.log('Admin account already exists, skipping...\n');
  
  // Customer account
  await createTestAccount(
    'purchasing@spicegrill.com',
    'customer123',
    'customer',
    'Spice Grill House',
    '+1 555 0123',
    '221 Market St, Springfield',
    'active'
  );
  
  console.log('\nDone!');
}

main().catch(console.error);
