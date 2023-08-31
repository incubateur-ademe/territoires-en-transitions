import { supabase } from '../../lib/supabase.ts';
import { signIn, signOut } from '../../lib/auth.ts';
import { testReset } from '../../lib/rpcs/testReset.ts';
import {
    assertEquals,
} from 'https://deno.land/std@0.198.0/assert/mod.ts';
import * as xlsx from 'https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs';
import * as cptable from 'https://deno.land/x/sheetjs@v0.18.3/dist/cpexcel.full.mjs';
xlsx.set_cptable(cptable);

const dirtyOptions = {
  sanitizeResources: false,
  sanitizeOps: false,
};

const pathToFormData = async (path : string) : Promise<FormData> => {
    const buff = Deno.readFileSync(path);
    const form = new FormData();
    form.append("file", new Blob([buff]));
    form.append("planId", "1");
    form.append("planNom", "import test");
    form.append("collectivite_id", "1");
    return form;
}

Deno.test("Importer un nouveau plan d'action", dirtyOptions, async (t) => {
  await testReset();
  await signIn("yolododo");

  const path = "./ressources/Plan_nouveau.xlsx";
  const reponse = await supabase.functions.invoke("import_plan_action", {
    body: await pathToFormData(path),
  });
  assertEquals(reponse.data, "ok");

    await signOut();
});

Deno.test("Importer un plan d'action avec une erreur de budget", async (t) => {
    await testReset();
    await signIn('yolododo');

    const path = './ressources/Plan_erreur_montant.xlsx';
    const reponse = await supabase.functions.invoke("import_plan_action", {
        body: await pathToFormData(path),
    });
    assertEquals(reponse.data, '{"error":"Cellule Y4 : Les montants ne doivent contenir que des chiffres : Entre 200 et 500"}');

    await signOut();
});

Deno.test("Importer un plan d'action avec une erreur de colonnes", async (t) => {
    await testReset();
    await signIn('yolododo');

    const path = './ressources/Plan_erreur_colonnes.xlsx';
    const reponse = await supabase.functions.invoke("import_plan_action", {
        body: await pathToFormData(path),
    });
    assertEquals(reponse.data, '{"error":"La colonne Budget prévisionnel total € TTC n\'est pas au bon endroit."}');

    await signOut();
});



