import {
  assertEquals,
  assertExists,
} from 'https://deno.land/std/testing/asserts.ts';
import { signIn, signOut } from '../../lib/auth.ts';
import { testChangeAccessRestreint } from '../../lib/rpcs/testChangeAccessRestreint.ts';
import { testReset } from '../../lib/rpcs/testReset.ts';
import { supabase } from '../../lib/supabase.ts';

const dirtyOptions = {
  sanitizeResources: false,
  sanitizeOps: false,
};

await new Promise((r) => setTimeout(r, 0));

Deno.test('Test acces fiche_action', async () => {
  await testReset();
  await testChangeAccessRestreint(1, false);

  // Passe la fiche 1 sans acces restreint
  await signIn('yolododo');
  await supabase.from('fiche_action').update({ restreint: false }).eq('id', 1);
  await signOut();

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la fiche 1
  await signIn('yolododo');
  const result1 = await supabase.from('fiche_action').select().eq('id', 1);
  assertExists(result1.data);
  assertEquals(true, result1.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la fiche 1
  await signIn('yulududu');
  const result2 = await supabase.from('fiche_action').select().eq('id', 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Passe la fiche 1 en acces restreint
  await signIn('yolododo');
  await supabase.from('fiche_action').update({ restreint: true }).eq('id', 1);
  await signOut();

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la fiche 1
  await signIn('yolododo');
  const result3 = await supabase.from('fiche_action').select().eq('id', 1);
  assertExists(result3.data);
  assertEquals(true, result3.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la fiche 1
  await signIn('yulududu');
  const result4 = await supabase.from('fiche_action').select().eq('id', 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length == 0);
  await signOut();
});

Deno.test('Test acces plan et ses fiches', async () => {
  await testReset();
  await testChangeAccessRestreint(1, false);

  // Passe l'axe 1 sans acces restreint
  await signIn('yolododo');
  await supabase.rpc('restreindre_plan', { plan_id: 1, restreindre: false });
  await signOut();

  // Test que yolododo, qui appartient à la collectivite 1,
  // a accès aux données de la fiche 1
  await signIn('yolododo');
  const result2 = await supabase.from('fiche_action').select().eq('id', 1);
  assertExists(result2.data);
  assertEquals(true, result2.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // a accès aux données de la fiche 1
  await signIn('yulududu');
  const result4 = await supabase.from('fiche_action').select().eq('id', 1);
  assertExists(result4.data);
  assertEquals(true, result4.data.length > 0);
  await signOut();

  // Passe la fiche 1 en acces restreint
  await signIn('yolododo');
  await supabase.rpc('restreindre_plan', { plan_id: 1, restreindre: true });
  await signOut();

  // Test que yolododo, qui appartient à la collectivite 1,
  // a toujours accès aux données de la fiche 1
  await signIn('yolododo');
  const result6 = await supabase.from('fiche_action').select().eq('id', 1);
  assertExists(result6.data);
  assertEquals(true, result6.data.length > 0);
  await signOut();

  // Test que yulududu, qui n'appartient pas à la collectivite 1,
  // n'a plus accès aux données de la fiche 1
  await signIn('yulududu');

  const result8 = await supabase.from('fiche_action').select().eq('id', 1);
  assertExists(result8.data);
  assertEquals(true, result8.data.length == 0);
  await signOut();
});
