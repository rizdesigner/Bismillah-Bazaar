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

async function fixCustomerAccount() {
  const email = 'purchasing@spicegrill.com';
  
  // Get user ID from auth
  const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${email}`, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`
    }
  });

  const authUsers = await authResponse.json();
  if (!authUsers.users || authUsers.users.length === 0) {
    console.error('User not found in auth');
    return;
  }

  const userId = authUsers.users[0].id;
  console.log(`Found user ID: ${userId}`);

  // Insert into public users table
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
      role: 'customer',
      restaurant_name: 'Spice Grill House',
      phone: '+1 555 0123',
      location: '221 Market St, Springfield',
      status: 'active'
    })
  });

  if (profileResponse.ok) {
    console.log('✓ Customer account created successfully!');
  } else {
    const errText = await profileResponse.text();
    console.error(`✗ Failed: ${errText}`);
  }
}

fixCustomerAccount().catch(console.error);
