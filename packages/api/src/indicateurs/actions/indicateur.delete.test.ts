import { beforeAll, expect, test } from 'vitest';
import { signIn, signOut } from '../../tests/auth';
import { dbAdmin, supabase } from '../../tests/supabase';
import { testReset } from '../../tests/testReset';
import { deleteIndicateur } from './indicateur.delete';
import { selectIndicateurDefinition } from './indicateur.fetch';

beforeAll(async () => {
  await signIn('yolododo');
  await testReset();

  return async () => {
    await signOut();
  };
});

test('Test deleteIndicateur', async () => {
  // Supprimer indicateur personnalisé
  const { data } = await dbAdmin
    .from('indicateur_definition')
    .select('id')
    .not('collectivite_id', 'is', null)
    .limit(1)
    .single();

  if (!data) {
    expect.fail();
  }

  await deleteIndicateur(supabase, data.id, 1);
  const def = await selectIndicateurDefinition(supabase, data.id, 1);
  expect(def).toBeNull();

  // Supprimer indicateur prédéfini (pas possible)
  await deleteIndicateur(supabase, 1, 1);
  const def2 = await selectIndicateurDefinition(supabase, 1, 1);
  expect(def2).not.toBeNull();
});
