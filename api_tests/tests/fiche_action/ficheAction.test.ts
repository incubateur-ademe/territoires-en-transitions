import {
    assertEquals,
    assertNotEquals,
    assertObjectMatch,
} from "https://deno.land/std/testing/asserts.ts";
import {supabase} from "../../lib/supabase.ts";
import {signIn, signOut} from "../../lib/auth.ts";
import {testReset} from "../../lib/rpcs/testReset.ts";
import {FicheAction} from "../../lib/types/fiche_action/ficheAction.ts";
import {FicheActionThematiques} from "../../lib/types/fiche_action/enums/ficheActionThematiques.ts";
import {FicheActionPiliersEci} from "../../lib/types/fiche_action/enums/ficheActionPiliersEci.ts";

Deno.test("Création fiches et plan actions", async () => {
    await testReset();
    await signIn("yolododo");

    const fiche = {
        titre : "fiche test",
        description : "description test",
        thematiques: [
            "Agriculture et alimentation" as FicheActionThematiques
        ],
        piliers_eci: [
            "Sobriété énergétique" as FicheActionPiliersEci,
            "Efficacité énergétique" as FicheActionPiliersEci
        ]
    };
    const insert = await supabase.from<FicheAction>("fiche_action").upsert(fiche);

    assertEquals(insert.data!.length, 1);
    assertObjectMatch(insert.data![0], fiche);

    await signOut();
});