import { supabase } from '../../lib/supabase.ts';
import { signIn, signOut } from '../../lib/auth.ts';
import { testReset } from '../../lib/rpcs/testReset.ts';
import {
  assertExists,
  assertInstanceOf,
  assertAlmostEquals,
} from 'https://deno.land/std@0.198.0/assert/mod.ts';

Deno.test("Exporter un plan d'action", async (t) => {
  await testReset();
  await signIn('yolododo');

  /**
   Ces tests sont commentés car en CI on ne lance pas le front, donc le template XLSX
   ne peut pas être chargé par la fonction d'export.
   Décommenter pour développer ou si l'export est modifié pour ne plus dépendre d'un template. 
   
  await t.step('au format Excel', async () => {
    const response = await supabase.functions.invoke('export_plan_action', {
      body: { planId: 1, format: 'xlsx' },
    });

    assertIsBlobWithExpectedSize(response.data, 76 * 1024);
  });

  await t.step('au format Word', async () => {
    const response = await supabase.functions.invoke('export_plan_action', {
      body: { planId: '1', format: 'docx' },
    });

    assertIsBlobWithExpectedSize(response.data, 11 * 1024);
  });
 */

  await t.step('au format Word (une seule fiche)', async () => {
    // export la fiche id=6
    const response = await supabase.functions.invoke('export_plan_action', {
      body: { ficheId: 6, format: 'docx' },
    });

    assertIsBlobWithExpectedSize(response.data, 9 * 1024);
  });

  await signOut();
});

// vérifie qu'on a des données et que la taille est celle attendue +/- 1ko
const assertIsBlobWithExpectedSize = (data: any, expectedSize: number) => {
  assertExists(data);
  assertInstanceOf(data, Blob);
  assertAlmostEquals(data.size, expectedSize, 1 * 1024);
};
