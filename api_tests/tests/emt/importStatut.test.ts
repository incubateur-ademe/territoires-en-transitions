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
    form.append("collectivite_id", "1");
    form.append("test", "true");
    return form;
}

Deno.test("Importer des nouveaux statuts emt", dirtyOptions, async (t) => {
    await testReset();

    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/import_statut_emt`;
    const headers = {
      apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    };
    const path = "./ressources/ImportStatutEMT.xlsx";

    const formData = await pathToFormData(path);

    const reponse = await fetch(url, {
        method: "POST",
        body: formData,
        headers: headers,
    });

    assertEquals(await reponse.text(), "ok");
});
