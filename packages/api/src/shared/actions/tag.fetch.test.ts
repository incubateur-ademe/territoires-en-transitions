import { beforeAll, expect, test } from 'vitest';
import { signIn, signOut } from '../../tests/auth';
import { supabase } from '../../tests/supabase';
import { testReset } from '../../tests/testReset';
import { selectTags } from './tag.fetch';

beforeAll(async () => {
  await signIn('yolododo');
  await testReset();

  return async () => {
    await signOut();
  };
});

test('Test selectTags', async () => {
  const def = await selectTags(supabase, 1, 'service');
  expect(def).not.toHaveLength(0);
});
