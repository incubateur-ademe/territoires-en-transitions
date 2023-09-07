import { supabase } from '/lib/supabase.ts';
import { signIn, signOut } from '/lib/auth.ts';
import { testReset } from '/lib/rpcs/testReset.ts';
import {
  assertExists,
  assertInstanceOf,
  assertAlmostEquals,
} from 'https://deno.land/std@0.198.0/assert/mod.ts';

Deno.test("Exporter un plan d'action", async (t) => {
  await testReset();
  await signIn('yolododo');

  await t.step('au format Excel', async () => {
    // export le plan id=1
    const response = await supabase.functions.invoke('export_plan_action', {
      body: { planId: '1', format: 'xlsx' },
    });

    // vérifie qu'on a des données et que la taille est d'environ 70 ko (+/- 10ko)
    assertExists(response.data);
    assertInstanceOf(response.data, Blob);
    assertAlmostEquals(response.data.size, 70 * 1024, 10 * 1024);
  });

  await t.step('au format Word', async () => {
    // export le plan id=1
    const response = await supabase.functions.invoke('export_plan_action', {
      body: { planId: '1', format: 'docx' },
    });

    // vérifie qu'on a des données et que la taille est d'environ 10 ko (+/- 5ko)
    assertExists(response.data);
    assertInstanceOf(response.data, Blob);
    assertAlmostEquals(response.data.size, 10 * 1024, 5 * 1024);
  });

  await signOut();
});
