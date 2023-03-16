// deno-lint-ignore-file

import {supabase} from '../../lib/supabase.ts';
import {signIn, signOut} from '../../lib/auth.ts';
import {
  assertEquals,
  assertExists,
} from 'https://deno.land/std@0.113.0/testing/asserts.ts';
import {Database} from "../../lib/database.types.ts";

Deno.test('Tableau de bord plan action', async () => {
  await signIn('yolododo');


  // Appel fonction pour toutes les fiches de la collectivité 1
  const reponse = await supabase.rpc('plan_action_tableau_de_bord', {
    'collectivite_id': 1,
    'sans_plan': false,
    // @ts-ignore
    'plan_id': null
  }).select();
  const tdb = reponse.data as unknown as Database['typage']['Tables']['plan_action_tableau_de_bord']['Row'];
  assertExists(tdb);
  const pilotes = tdb.pilotes as Database['typage']['Tables']['graphique_tranche']['Row'][];
  assertExists(pilotes);
  assertEquals(pilotes.length, 4);

  // Appel fonction pour toutes les fiches du plan 12 de la collectivité 1
  const reponse2 = await supabase.rpc('plan_action_tableau_de_bord', {
    'collectivite_id': 1,
    'sans_plan': false,
    'plan_id': 12
  }).select();
  const tdb2 = reponse2.data as unknown as Database['typage']['Tables']['plan_action_tableau_de_bord']['Row'];
  assertExists(tdb2);
  const pilotes2 = tdb2.pilotes as Database['typage']['Tables']['graphique_tranche']['Row'][];
  assertExists(pilotes2);
  assertEquals(pilotes2.length, 1);

  // Appel fonction pour toutes les fiches non classées de la collectivité 1
  const reponse3 = await supabase.rpc('plan_action_tableau_de_bord', {
    'collectivite_id': 1,
    'sans_plan': true,
    // @ts-ignore
    'plan_id': null
  }).select();
  const tdb3 = reponse3.data as unknown as Database['typage']['Tables']['plan_action_tableau_de_bord']['Row'];
  assertExists(tdb3);
  const pilotes3 = tdb3.pilotes as Database['typage']['Tables']['graphique_tranche']['Row'][];
  assertExists(pilotes3);
  assertEquals(pilotes3.length, 1);

  console.log(pilotes2)

  await signOut();
});
