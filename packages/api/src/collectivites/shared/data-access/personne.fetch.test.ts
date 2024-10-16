import { signIn, signOut } from '@tet/api/tests/auth';
import { testReset } from '@tet/api/tests/testReset';
import { beforeAll, expect, test } from 'vitest';
import { fetchPersonnes } from './personne.fetch';
import { supabase } from '@tet/api/tests/supabase';

beforeAll(async () => {
  await signIn('yolododo');
  await testReset();

  return async () => {
    await signOut();
  };
});

test('Test selectPersonnes', async () => {
  const data = await fetchPersonnes(supabase, 1);
  expect(data).not.toHaveLength(0);
});
