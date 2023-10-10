import { supabase } from "../../lib/supabase.ts";
import { signIn, signOut } from "../../lib/auth.ts";
import { testReset } from "../../lib/rpcs/testReset.ts";
import {
    assertEquals,
    assertExists,
} from "https://deno.land/std@0.113.0/testing/asserts.ts";

await new Promise((r) => setTimeout(r, 0));

const dirtyOptions = {
    sanitizeResources: false,
    sanitizeOps: false,
};

Deno.test("Indicateurs par axe", dirtyOptions, async () => {
    await testReset();
    await signIn("yolododo");

    // Ajouter un indicateur référentiel et personnalisé à une fiche
    await supabase
        .from("fiche_action_indicateur")
        .insert({indicateur_id : 'eci_37', indicateur_personnalise_id : null, fiche_id : 7});

    await supabase
        .from("fiche_action_indicateur")
        .insert({indicateur_id : null, indicateur_personnalise_id : 0, fiche_id : 8});

    // Test
    const filterResponse = await supabase.rpc("filter_indicateurs", {
        collectivite_id: 1,
        axes_id: [16]
    });
    assertExists(filterResponse.data);
    assertEquals(filterResponse.data.length, 2);

    await signOut();
});

Deno.test("Indicateurs par pilote", dirtyOptions, async () => {
    await testReset();
    await signIn("yolododo");

    // Ajouter un pilote à un indicateur référentiel et personnalisé
    await supabase
        .from("indicateur_pilote")
        .insert({indicateur_id : 'eci_37', collectivite_id : 1, user_id : null, tag_id : 1});

    await supabase
        .from("indicateur_personnalise_pilote")
        .insert({indicateur_id : 0, user_id : null, tag_id : 1});

    const pilotes = [
        // @ts-ignore
        { nom: "Lou Piote", collectivite_id: 1, tag_id: 1, user_id: null },
    ];

    // on filtre avec l'axe et le tag pilote.
    const filterResponse = await supabase.rpc("filter_indicateurs", {
        collectivite_id: 1,
        // @ts-ignore()
        pilotes: pilotes,
    });
    assertExists(filterResponse.data);
    assertEquals(filterResponse.data.length, 2);

    await signOut();
});

Deno.test("Indicateurs par service", dirtyOptions, async () => {
    await testReset();
    await signIn("yolododo");

    // Ajouter un service à un indicateur référentiel et personnalisé
    await supabase
        .from("indicateur_service_tag")
        .insert({indicateur_id : 'eci_37', collectivite_id : 1, service_tag_id : 1});

    await supabase
        .from("indicateur_personnalise_service_tag")
        .insert({indicateur_id : 0, service_tag_id : 1});

    const services = [
        // @ts-ignore
        { nom: "Super service", collectivite_id: 1, id : 1},
    ];

    const filterResponse = await supabase.rpc("filter_indicateurs", {
        collectivite_id: 1,
        // @ts-ignore()
        services: services,
    });
    assertExists(filterResponse.data);
    assertEquals(filterResponse.data.length, 2);

    await signOut();
});

Deno.test("Indicateurs par thematique", dirtyOptions, async () => {
    await testReset();
    await signIn("yolododo");

    // Ajouter une thématique à un indicateur personnalisé
    await supabase
        .from("indicateur_personnalise_thematique")
        .insert({indicateur_id : 0, thematique: "Activités économiques"});

    const filterResponse = await supabase.rpc("filter_indicateurs", {
        collectivite_id: 1,
        thematiques: [{ thematique: "Activités économiques" }],
    });
    assertExists(filterResponse.data);
    assertEquals(filterResponse.data.length, 1);

    const filterResponse2 = await supabase.rpc("filter_fiches_action", {
        collectivite_id: 1,
        thematiques: [{ thematique: "Énergie et climat" }],
    });
    assertExists(filterResponse2.data);
    assertEquals(filterResponse2.data.length, 0);

    await signOut();
});

Deno.test("Indicateurs sans plan", dirtyOptions, async () => {
    await testReset();
    await signIn("yolododo");

    const filterResponse = await supabase.rpc("filter_indicateurs", {
        collectivite_id: 1,
        sans_plan: true,
    });
    assertExists(filterResponse.data);
    assertEquals(filterResponse.data.length, 10); // Limite par défaut à 10

    await signOut();
});
