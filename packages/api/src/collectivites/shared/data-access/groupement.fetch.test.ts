import { beforeAll, expect, test } from 'vitest';
import { signIn, signOut } from '../../../tests/auth';
import { testReset } from '../../../tests/testReset';
import { dbAdmin, supabase } from '../../../tests/supabase';
import {
  selectGroupementParCollectivite,
  selectGroupements,
} from './groupement.fetch';
import { Groupement } from '../domain/groupement.schema';

beforeAll(async () => {
  await testReset();
  const { data: gp } = await dbAdmin
    .from('groupement')
    .insert({ nom: 'test' })
    .select('id')
    .single();

  if (!gp) {
    expect.fail();
  }

  await dbAdmin
    .from('groupement_collectivite')
    .insert({ collectivite_id: 1, groupement_id: gp.id });

  await signIn('yolododo');

  return async () => {
    await signOut();
  };
});

test('Test selectGroupementParCollectivite', async () => {
  const def = await selectGroupementParCollectivite(supabase, 1);
  expect(def).toHaveLength(1);
});

test('Test selectGroupements', async () => {
  const def: Groupement[] = await selectGroupements(supabase);
  expect(def).toHaveLength(1);
});
