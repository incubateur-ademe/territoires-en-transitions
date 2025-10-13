import { testWithUsers } from '../fixtures/users.fixture';

const test = testWithUsers;

// Extract project reference from Supabase URL for cookie name
// e.g., "http://127.0.0.1:54321" -> "127"
// e.g., "https://abc123.supabase.co" -> "abc123"
function getSupabaseProjectRef(url: string): string {
  const urlObj = new URL(url);
  if (urlObj.hostname === 'localhost' || urlObj.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    // For localhost/IP addresses, use the first part before the first dot
    return urlObj.hostname.split('.')[0];
  }
  // For hosted Supabase, extract subdomain (project ref)
  return urlObj.hostname.split('.')[0];
}

test('setup authentication with test user and collectivite', async ({ request, context, users }) => {
  const { user } = await users.addCollectiviteAndUser();

  const supabaseUrl = process.env.SUPABASE_API_URL;
  if (!supabaseUrl) {
    throw new Error('SUPABASE_API_URL environment variable is not set');
  }

  const authUrl = `${supabaseUrl}/auth/v1/token?grant_type=password`;
  const response = await request.post(authUrl, {
    data: { email: user.email, password: user.password }
  });

  if (!response.ok()) {
    throw new Error(`Authentication failed with status ${response.status()}`);
  }

  const authData = (await response.body()).toString();

  // Derive cookie name from Supabase URL
  const projectRef = getSupabaseProjectRef(supabaseUrl);
  const cookieName = `sb-${projectRef}-auth-token`;

  // Extract domain from URL (localhost for local development)
  const urlObj = new URL(supabaseUrl);
  const domain = urlObj.hostname === 'localhost' || urlObj.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)
    ? 'localhost'
    : urlObj.hostname;

  await context.addCookies([
    {
      name: cookieName,
      value: `base64-${Buffer.from(authData).toString('base64')}`,
      path: '/',
      domain
    }
  ]);

  // Save signed-in state to 'auth.json'.
  await context.storageState({ path: 'auth.json' });
});
