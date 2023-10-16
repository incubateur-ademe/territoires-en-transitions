import {
    assertEquals,
    assertExists,
} from "https://deno.land/std/testing/asserts.ts";
import { supabase } from "../../lib/supabase.ts";
import { signIn, signOut } from "../../lib/auth.ts";
import { testReset } from "../../lib/rpcs/testReset.ts";
import {Database} from "../../lib/database.types.ts";

const dirtyOptions = {
    sanitizeResources: false,
    sanitizeOps: false,
};

await new Promise((r) => setTimeout(r, 0));

Deno.test("Test type", async () => {
    await testReset();
    await signIn("yolododo");

    // Lister les types
    const types = await supabase.from('plan_action_type').select();
    const type : Database['public']['Tables']['plan_action_type']['Row'] =
        types.data![0];
    assertEquals('Plans transverses', type.categorie); // Catégorie du type
    assertEquals('Projet de Territoire', type.type); // Type
    assertEquals('dont Agenda 2030, Développement Durable', type.detail); // Détail du type

    // Modifier le type d'un axe
    const plan = await supabase.from('axe').update({type : type.id}).eq('id', 1).select();
    assertEquals(1, plan.data![0].type);

    await signOut();
});

Deno.test("Test plan", async () => {
    await testReset();
    await signIn("yolododo");

    // Ajouter un plan
    const planInsert = await supabase.from('axe').insert({collectivite_id : 1, nom : 'Plan Test'}).select();
    const plan : Database['public']['Tables']['axe']['Row'] = planInsert.data![0];
    assertEquals(plan.id, plan.plan);

    // Ajouter un axe
    const axeInsert = await supabase.from('axe').insert({collectivite_id : 1, nom : 'Axe Test', parent : plan.id}).select();
    const axe : Database['public']['Tables']['axe']['Row'] = axeInsert.data![0];
    assertEquals(plan.id, axe.plan);

    await signOut();
});
