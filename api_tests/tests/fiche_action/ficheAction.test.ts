import {
    assertEquals,
    assertObjectMatch,
    assertExists
} from "https://deno.land/std/testing/asserts.ts";
import {supabase} from "../../lib/supabase.ts";
import {signIn, signOut} from "../../lib/auth.ts";
import {testReset} from "../../lib/rpcs/testReset.ts";
import {Database} from "../../lib/database.types.ts";

Deno.test("Création fiches et plan actions", async () => {
    await testReset(); // TODO ajouter fiches aux resets
    await signIn("yolododo");

    const fiche = {
        titre : "fiche test",
        description : "description test",
        thematiques: [
            "Bâtiments" as Database["public"]["Enums"]["fiche_action_thematiques"]
        ],
        piliers_eci: [
            "Écoconception" as Database["public"]["Enums"]["fiche_action_piliers_eci"],
            "Recyclage" as Database["public"]["Enums"]["fiche_action_piliers_eci"]
        ],
        collectivite_id : 1
    };
    const insertFiche = await supabase.from("fiche_action").upsert(fiche).select();

    assertEquals(insertFiche.data!.length, 1);
    assertObjectMatch(insertFiche.data![0], fiche);

    const partenaire = {
        collectivite_id: 1,
        nom : "partenaire test"
    }
    const insertPartenaire = await supabase.from("partenaires_tags").upsert(partenaire).select();
    assertEquals(insertPartenaire.data!.length, 1);
    assertObjectMatch(insertPartenaire.data![0], partenaire);

    await supabase.rpc(
        "upsert_fiche_action_partenaires",
        { "fiche_action_id": insertFiche.data![0].id, "partenaires": [insertPartenaire.data![0].id] }
    );

    const fapt = await supabase.from("fiche_action_partenaires_tags")
        .select()
        .eq("fiche_id", insertFiche.data![0].id);

    assertEquals(fapt.data!.length, 1);

    const vue = await supabase.from("fiches_action")
        .select()
    assertExists(vue.data)
    console.log(vue)

    await signOut();
});