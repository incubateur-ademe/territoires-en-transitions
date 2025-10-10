import { setUpWithUsers } from './fixtures/users.fixture';

const test = setUpWithUsers;

test('authenticate', async ({ request, context, users }) => {
  // Send authentication request. Replace with your own.
  const { user } = await users.addCollectiviteAndUser();

  const response = await request.post(`${process.env.SUPABASE_API_URL}/auth/v1/token?grant_type=password`, {
    data: { "email": user.email, "password": user.password }
  });

  const result: string = await response.body().then((body) => {
    return body.toString();
  });

  await context.addCookies([
    { name: 'sb-127-auth-token', value: `base64-${Buffer.from(result).toString('base64')}`, path: '/', domain: 'localhost' }
  ]);

  // Save signed-in state to 'auth.json'.
  await context.storageState({ path: 'auth.json' });
});
