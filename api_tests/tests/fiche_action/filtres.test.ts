// deno-lint-ignore-file

import {supabase} from '../../lib/supabase.ts';
import {signIn, signOut} from '../../lib/auth.ts';
import {testReset} from '../../lib/rpcs/testReset.ts';
import {assertExists} from 'https://deno.land/std@0.113.0/testing/asserts.ts';

Deno.test('Fiches par axe', async () => {
  await testReset();
  await signIn('yolododo');

  const selectResponse1 = await supabase.rpc('filter_fiches_action', {
    collectivite_id: 1,
    axe_id: 16,
    // @ts-ignore
    pilote_tag_id: null, niveau_priorite: null,  pilote_user_id: null, referent_tag_id: null, referent_user_id: null, statut: null,
  });
  assertExists(selectResponse1.data);

  await signOut();
});
