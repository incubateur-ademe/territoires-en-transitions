import {beforeAll, expect, test} from 'vitest';
import {signIn, signOut} from '../../tests/auth';
import {supabase} from '../../tests/supabase';
import {testReset} from '../../tests/testReset';
import {selectCategories} from './categorie.fetch';

beforeAll(async () => {
  await signIn('yolododo');
  await testReset();

  return async () => {
    await signOut();
  };
});

test('Test selectCategories', async () => {
  const def = await selectCategories(supabase, 1);
  expect(def!).toHaveLength(16);
});
