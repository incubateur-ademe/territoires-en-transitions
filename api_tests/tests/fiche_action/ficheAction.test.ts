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
    await testReset();
    await signIn("yolododo");

    // FICHE ACTION
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
    // Création fiche action
    const insertFiche = await supabase.from("fiche_action").upsert(fiche).select();
    assertEquals(insertFiche.data!.length, 1);
    assertObjectMatch(insertFiche.data![0], fiche);
    const fId = insertFiche.data![0].id;

    // Fonction pour modifier/ajouter tous les liens d'une fiche en une fois
    await supabase.rpc(
        "upsert_fiche_action_liens",
        {
            "fiche_action_id": fId,
            "partenaires" : [],
            "structures" : [],
            "pilotes_tags" : [],
            "pilotes_users" : [],
            "referents_tags" : [],
            "referents_users" : [],
            "annexes" : [],
            "plans_action" : [],
            "actions" : [],
            "indicateurs" : [],
            "indicateurs_personnalise" : []
        }
    );

    // PARTENAIRES
    const partenaire = {collectivite_id: 1, nom : "partenaire test"};
    // Création tag partenaire
    const insertPartenaire = await supabase.from("partenaires_tags").upsert(partenaire).select();
    assertEquals(insertPartenaire.data!.length, 1);
    assertObjectMatch(insertPartenaire.data![0], partenaire);
    // Ajout partenaire à la fiche
    await supabase.rpc("upsert_fiche_action_partenaires",
        { "fiche_action_id": fId, "partenaires": [insertPartenaire.data![0].id] });
    // Récupérer les partenaires de la fiche
    const fapt = await supabase.from("fiche_action_partenaires_tags").select().eq("fiche_id", fId);
    assertEquals(fapt.data!.length, 1);

    // STRUCTURES
    const structure = {collectivite_id: 1, nom : "structure test"};
    // Création tag structure
    const insertStructure = await supabase.from("structures_tags").upsert(structure).select();
    assertEquals(insertStructure.data!.length, 1);
    assertObjectMatch(insertStructure.data![0], structure);
    // Ajout structure à la fiche
    await supabase.rpc("upsert_fiche_action_structures",
        { "fiche_action_id": fId, "structures": [insertStructure.data![0].id] });
    // Récupérer les structures de la fiche
    const fast = await supabase.from("fiche_action_structures_tags").select().eq("fiche_id", fId);
    assertEquals(fast.data!.length, 1);

    // PILOTES
    const pilote = {collectivite_id: 1, nom : "pilote test"};
    // Création tag pilote
    const insertPilote = await supabase.from("users_tags").upsert(pilote).select();
    assertEquals(insertPilote.data!.length, 1);
    assertObjectMatch(insertPilote.data![0], pilote);
    // Ajout pilote à la fiche (Soit pilotes_tag avec id tag, soit pilotes_users avec uuid vrai utilisateur)
    await supabase.rpc("upsert_fiche_action_pilotes",
        { "fiche_action_id": fId, "pilotes_tag": [insertPilote.data![0].id], "pilotes_user":[] });
    // Récupérer les pilotes de la fiche
    const fapit = await supabase.from("fiche_action_pilotes").select().eq("fiche_id", fId);
    assertEquals(fapit.data!.length, 1);

    // REFERENTS
    const referent = {collectivite_id: 1, nom : "referent test"};
    // Création tag referent
    const insertReferent = await supabase.from("users_tags").upsert(referent).select();
    assertEquals(insertReferent.data!.length, 1);
    assertObjectMatch(insertReferent.data![0], referent);
    // Ajout referent à la fiche (Soit referents_tag avec id tag, soit referents_users avec uuid vrai utilisateur)
    await supabase.rpc("upsert_fiche_action_referents",
        { "fiche_action_id": fId, "referents_tag": [insertReferent.data![0].id], "referents_user":[] });
    // Récupérer les referents de la fiche
    const faret = await supabase.from("fiche_action_referents").select().eq("fiche_id", fId);
    assertEquals(faret.data!.length, 1);

    // ANNEXES
    // Création annexe
    // TODO pas testé
    // Ajout annexe à la fiche
    await supabase.rpc("upsert_fiche_action_annexes",
        { "fiche_action_id": fId, "annexes": [] });
    // Récupérer les actions de la fiche
    const faan = await supabase.from("fiche_action_annexes").select().eq("fiche_id", fId);
    assertEquals(faan.data!.length, 0);

    // ACTIONS
    // Ajout action à la fiche
    await supabase.rpc("upsert_fiche_action_action",
        { "fiche_action_id": fId, "actions": [] });
    // Récupérer les actions de la fiche
    const faa = await supabase.from("fiche_action_action").select().eq("fiche_id", fId);
    assertEquals(faa.data!.length, 0);

    // INDICATEURS
    // Ajout indicateur à la fiche
    await supabase.rpc("upsert_fiche_action_indicateur",
        { "fiche_action_id": fId, "indicateurs": [] });
    // Récupérer les indicateurs de la fiche
    const fai = await supabase.from("fiche_action_indicateur").select().eq("fiche_id", fId);
    assertEquals(fai.data!.length, 0);
    // Ajout indicateur personnalisé à la fiche
    await supabase.rpc("upsert_fiche_action_indicateur_personnalise",
        { "fiche_action_id": fId, "indicateurs": [] });
    // Récupérer les indicateurs personnalisés de la fiche
    const faip = await supabase.from("fiche_action_indicateur_personnalise").select().eq("fiche_id", fId);
    assertEquals(faip.data!.length, 0);

    // PLANS ACTION
    const planAction = {
        nom: 'Plan test ts',
        collectivite_id: 1,
        parent : null
    };
    // Création plan action
    const insertPlanAction = await supabase.from("plan_action").upsert(planAction).select();
    assertEquals(insertPlanAction.data!.length, 1);
    assertObjectMatch(insertPlanAction.data![0], planAction);
    const planActionEnfant = {
        nom: 'Plan test ts enfant',
        collectivite_id: 1,
        parent : insertPlanAction.data![0].id
    };
    const insertPlanActionEnfant = await supabase.from("plan_action").upsert(planActionEnfant).select();
    assertEquals(insertPlanActionEnfant.data!.length, 1);
    assertObjectMatch(insertPlanActionEnfant.data![0], planActionEnfant);
    // Ajout plan à la fiche
    await supabase.rpc("upsert_fiche_action_plan_action",
        { "fiche_action_id": fId, "plans_action": [insertPlanActionEnfant.data![0].id] });
    // Récupérer les plans de la fiche
    const fapa = await supabase.from("fiche_action_plan_action").select().eq("fiche_id", fId);
    assertEquals(fapa.data!.length, 1);

    // Appeler la vue listant les fiches actions
    const vue = await supabase.from("fiches_action")
        .select();
    assertExists(vue.data);
    console.log(vue);

    // Appeler la vue donnant l'ensemble d'un plan action
    const planentier =  await supabase.rpc("recursive_plan_action",
        { "pa_id": insertPlanAction.data![0].id }).select();
    assertExists(planentier.data);
    console.log(planentier);

    await signOut();
});