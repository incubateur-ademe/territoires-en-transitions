import { TagCreate } from '@tet/domain/collectivites';
import { beforeAll, expect, test } from 'vitest';
import { signIn, signOut } from '../../tests/auth';
import { supabase } from '../../tests/supabase';
import { testReset } from '../../tests/testReset';
import { insertTags } from './tag.save';

beforeAll(async () => {
  await signIn('yolododo');
  await testReset();

  return async () => {
    await signOut();
  };
});

test('Test insertTags', async () => {
  const toInsert: TagCreate[] = [
    {
      nom: 'test',
      collectiviteId: 1,
    },
    {
      nom: 'test2',
      collectiviteId: 1,
    },
  ];
  const def = await insertTags(supabase, 'categorie', toInsert);
  expect(def).toHaveLength(2);
});
