import { setUpWithUsers } from './fixtures/users.fixture';

const test = setUpWithUsers;

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

  const cookieName = `sb-${"http://localhost:3000"}-auth-token`;

  const domain = "localhost";

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
