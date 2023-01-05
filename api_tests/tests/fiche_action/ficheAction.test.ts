// deno-lint-ignore-file

import {
    assertEquals,
    assertObjectMatch,
    assertExists
} from "https://deno.land/std/testing/asserts.ts";
import {supabase} from "../../lib/supabase.ts";
import {signIn, signOut} from "../../lib/auth.ts";
import {testReset} from "../../lib/rpcs/testReset.ts";
import {Database} from "../../lib/database.types.ts";
import {IndicateurGlobal} from "../../lib/types/fiche_action/indicateurGlobal.ts";
import {Personne} from "../../lib/types/fiche_action/personne.ts";
import {FicheActionVueInsert, FicheActionVueRow, FicheActionVueUpdate} from "../../lib/types/fiche_action/ficheActionVue.ts";



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
    } as Database["public"]["Tables"]["fiche_action"]["Insert"];
    // Création fiche action
    const insertFiche = await supabase.from("fiche_action").upsert(fiche).select();
    assertEquals(insertFiche.data!.length, 1);
    assertObjectMatch(insertFiche.data![0], fiche);
    const fId = insertFiche.data![0].id;

    // PLAN ACTION
    // Création plan action et axe
    const planAction = {
        nom: 'Plan test ts',
        collectivite_id: 1,
        parent : null
    } as Database["public"]["Tables"]["axe"]["Insert"];
    const insertPlanAction = await supabase.from("axe").upsert(planAction).select();
    assertEquals(insertPlanAction.data!.length, 1);
    assertObjectMatch(insertPlanAction.data![0], planAction);
    const axe = {
        nom: 'Plan test ts enfant',
        collectivite_id: 1,
        parent : insertPlanAction.data![0].id
    } as Database["public"]["Tables"]["axe"]["Insert"];
    const insertAxe = await supabase.from("axe").upsert(axe).select();
    assertEquals(insertAxe.data!.length, 1);
    assertObjectMatch(insertAxe.data![0], axe);
    // Ajout fiche à l'axe
    await supabase.rpc("ajouter_fiche_action_dans_un_axe",
        { "id_fiche": fId, id_axe: insertAxe.data![0].id });
    // Enlever fiche d'un axe
    await supabase.rpc("enlever_fiche_action_d_un_axe",
        { "id_fiche": fId, id_axe: insertAxe.data![0].id });
    // Récupérer la liste d'indicateur possible pour la collectivité
    const plansActionCol = await supabase.rpc("plans_action_collectivite", {"id_collectivite": 1}).select();
    const plansActionColData = plansActionCol.data! as Database["public"]["Tables"]["axe"]["Row"][];


    // PARTENAIRE
    const partenaire = {collectivite_id: 1, nom : "partenaire test"} as Database["public"]["Tables"]["partenaire_tag"]["Insert"];
    // Création et ajout partenaire à la fiche
    const insertPartenaire = await supabase.rpc("ajouter_partenaire",
        { "id_fiche": fId, "partenaire": partenaire }).select();
    const partenaireSave = insertPartenaire.data! as unknown as Database["public"]["Tables"]["partenaire_tag"]["Row"];
    // console.logpartenaireSave);
    assertObjectMatch(partenaireSave, partenaire);
    const lienPartenaire = await supabase.from("fiche_action_partenaire_tag")
        .select().eq("fiche_id", fId);
    assertEquals(lienPartenaire.data!.length, 1);
    // Récupérer les tags de la fiche
    const partTags = await supabase.from("fiche_action_partenaire_tag")
        .select("partenaire_tag:partenaire_tag_id(*)").eq("fiche_id", fId);
    const partTagsData = partTags.data![0].partenaire_tag as Database["public"]["Tables"]["partenaire_tag"]["Row"][];
    // Enlever partenaire de la fiche
    const enlever = await supabase.rpc("enlever_partenaire",
        { "id_fiche": fId, "partenaire": partenaireSave});
    assertEquals(enlever.status, 200);
    const lienPartenaire2 = await supabase.from("fiche_action_partenaire_tag")
        .select().eq("fiche_id", fId);
    // console.loglienPartenaire2);
    assertEquals(lienPartenaire2.data!.length, 0);


    // STRUCTURE
    const structure = {collectivite_id: 1, nom : "structure test"} as Database["public"]["Tables"]["structure_tag"]["Insert"];;
    // Création et ajout structure à la fiche
    const insertStructure = await supabase.rpc("ajouter_structure",
        { "id_fiche": fId, "structure": structure }).select();
    assertObjectMatch(insertStructure.data!, structure);
    const lienStructure1 = await supabase.from("fiche_action_structure_tag")
        .select().eq("fiche_id", fId);
    assertEquals(lienStructure1.data!.length, 1);
    // Enlever structure de la fiche
    await supabase.rpc("enlever_structure",
        { "id_fiche": fId, "structure": insertStructure.data!});
    const lienStructure2 = await supabase.from("fiche_action_structure_tag")
        .select().eq("fiche_id", fId);
    assertEquals(lienStructure2.data!.length, 0);

    // PILOTE
    const piloteTag = {collectivite_id: 1, nom : "pilote test"} as Personne;
    const piloteUtilisateur = {collectivite_id: 1, nom : "pilote test2", utilisateur_uuid:'17440546-f389-4d4f-bfdb-b0c94a1bd0f9'} as Personne;
    // Création et ajout tag pilote à la fiche
    const insertPiloteTag =  await supabase.rpc("ajouter_pilote",
        { "id_fiche": fId, "pilote": piloteTag}).select();
    assertObjectMatch(insertPiloteTag.data!, piloteTag);
    // Création et ajout utilisateur pilote
    await supabase.rpc("ajouter_pilote",
        { "id_fiche": fId, "pilote": piloteUtilisateur});
    // Enlever pilote
    await supabase.rpc("enlever_pilote",
        { "id_fiche": fId, "pilote": insertPiloteTag.data!});


    // REFERENT
    const referentTag = {collectivite_id: 1, nom : "referent test"} as Personne;
    const referentUtilisateur = {collectivite_id: 1, nom : "referent test2", utilisateur_uuid:'17440546-f389-4d4f-bfdb-b0c94a1bd0f9'} as Personne;
    // Création et ajout tag referent à la fiche
    const insertReferentTag =  await supabase.rpc("ajouter_referent",
        { "id_fiche": fId, "referent": referentTag}).select();
    assertObjectMatch(insertReferentTag.data!, referentTag);
    // Création et ajout utilisateur referent
    await supabase.rpc("ajouter_referent",
        { "id_fiche": fId, "referent": referentUtilisateur});
    // Enlever referent
    await supabase.rpc("enlever_referent",
        { "id_fiche": fId, "referent": insertReferentTag.data!});

    // Récupérer la liste de personnes possible pour la collectivité
    const personnesCol = await supabase.rpc("personnes_collectivite", {"id_collectivite": 1}).select();
    const personnesColData = personnesCol.data! as Personne[];

    // ANNEXE
    // TODO pas testé
    const annexe = {collectivite_id: 1} as Database["public"]["Tables"]["annexe"]["Insert"];
    // Creation et ajout annexe à la fiche
    const insertAnnexe = await supabase.rpc("ajouter_annexe",
        { "id_fiche": fId, "annexe" : annexe }).select();
    // Enlever annexe à la fiche
    await supabase.rpc("enlever_annexe",
        { "id_fiche": fId, "annexe" : insertAnnexe.data! , "supprimer": false})

    // ACTION
    // Ajout action à la fiche
    await supabase.rpc("ajouter_action",
        { "id_fiche": fId, "id_action": "eci_2.2" });
    // Enlever action à la fiche
    await supabase.rpc("enlever_action",
        { "id_fiche": fId, "id_action": "eci_2.2" });

    // INDICATEUR
    // Ajout indicateur à la fiche
    const indicateur = {indicateur_id: 'eci_5'} as IndicateurGlobal;
    const indicateurPerso = {indicateur_personnalise_id: 1} as IndicateurGlobal;
    await supabase.rpc("ajouter_indicateur",
        { "id_fiche": fId, "indicateur": indicateur});
    await supabase.rpc("ajouter_indicateur",
        { "id_fiche": fId, "indicateur": indicateurPerso});
    // Enlever un indicateur à la fiche
    await supabase.rpc("enlever_indicateur",
        { "id_fiche": fId, "indicateur": indicateur});
    // Récupérer la liste d'indicateur possible pour la collectivité
    const indicateursCol = await supabase.rpc("indicateurs_collectivite", {"id_collectivite": 1}).select();
    const indicateursColData = indicateursCol.data! as IndicateurGlobal[];

    // Appeler la vue listant les fiches actions
    const vue = await supabase.from("fiches_action")
        .select().eq("id", fId);
    assertExists(vue.data);
    // console.logvue.data!);
    // Récupérer les types liés dans la vue
    const fichesVue:FicheActionVueRow  = vue.data![0] as FicheActionVueRow;
    const partenairesVue = vue.data![0].partenaires! as Database["public"]["Tables"]["partenaire_tag"]["Row"][];
    const structuresVue = vue.data![0].structures! as Database["public"]["Tables"]["structure_tag"]["Row"][];
    const pilotesVue = vue.data![0].pilotes! as Personne[];
    const referentsVue = vue.data![0].referents! as Personne[];
    const indicateursVue = vue.data![0].indicateurs! as IndicateurGlobal[];
    const annexesVue = vue.data![0].annexes! as Database["public"]["Tables"]["action_relation"]["Row"][];
    const actionVue = vue.data![0].actions! as Database["public"]["Tables"]["annexe"]["Row"][];
    const axesVue = vue.data![0].actions! as Database["public"]["Tables"]["axe"]["Row"][];
    // console.logfichesVue);

    // Appeler la vue donnant l'ensemble d'un plan action
    const planentier =  await supabase.rpc("plan_action",
        { "pa_id": insertPlanAction.data![0].id }).select();
    assertExists(planentier.data);
    // console.logplanentier);

    // Insérer dans la vue
    const ficheVue = {
        id : fId,
        titre : "fiche test",
        description : "description test",
        thematiques: [
            "Bâtiments" as Database["public"]["Enums"]["fiche_action_thematiques"]
        ],
        sous_thematiques: [] as Database["public"]["Enums"]["fiche_action_thematiques"][] ,
        piliers_eci: [
            "Écoconception" as Database["public"]["Enums"]["fiche_action_piliers_eci"]
        ],
        objectifs: "verif",
        resultats_attendus: [
            "Sensibilisation" as Database["public"]["Enums"]["fiche_action_resultats_attendus"]
        ],
        cibles: [
            "Grand public et associations" as Database["public"]["Enums"]["fiche_action_cibles"]
        ],
        ressources: null,
        financements: null,
        budget_previsionnel: null,
        statut: 'En cours' as Database["public"]["Enums"]["fiche_action_statuts"] ,
        niveau_priorite: 'Bas' as Database["public"]["Enums"]["fiche_action_niveaux_priorite"],
        date_debut: null,
        date_fin_provisoire: null,
        amelioration_continue: null,
        calendrier: null,
        notes_complementaires:  null,
        maj_termine: null,
        collectivite_id : 1,
        partenaires: partenairesVue,
        structures: [
            {collectivite_id: 1, nom : "structure test test"} as Database["public"]["Tables"]["structure_tag"]["Insert"]
        ],
        pilotes: pilotesVue,
        referents: referentsVue,
        annexes: annexesVue,
        axes: axesVue,
        actions: actionVue,
        indicateurs: indicateursVue
    } as FicheActionVueUpdate

    // Utilise `as never`, l'upsert dans les vues n'étant pas prévu par la lib Supabase.
    await supabase.from("fiches_action").update(ficheVue as never);

    const checkVue = await supabase.from("fiches_action")
        .select().eq("id", fId);
    // console.logcheckVue.data![0].objectifs);
    // console.logcheckVue.status);
    const objectiVerif:string = checkVue.data![0].objectifs as string;
    assertEquals(objectiVerif, "verif");
    assertEquals(checkVue.data![0].structures!.length, 1);
    await signOut();
});


Deno.test("Création d'une fiche en utilisant la vue", async () => {
    await testReset();
    await signIn("yolododo");

    // Une fiche dans les données de test
    const selectResponse1 = await supabase.from("fiches_action").select().eq('collectivite_id', 2);
    assertExists(selectResponse1.data);
    assertEquals(1, selectResponse1.data.length);

    // La fiche est insérée et est renvoyée avec un id
    const insertResponse =
      await supabase.from("fiches_action").insert({'collectivite_id': 2} as never).select();
    assertExists(insertResponse.data);
    assertExists(insertResponse.data[0]['id']);

    // La fiche est présente dans la vue.
    const selectResponse2 =  await supabase.from("fiches_action").select().eq('collectivite_id', 2);
    assertExists(selectResponse2.data);
    assertEquals(2, selectResponse2.data.length);

    await signOut();
});
