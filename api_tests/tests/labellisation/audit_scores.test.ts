import { assertEquals } from "https://deno.land/std@0.163.0/testing/asserts.ts";
import { supabase } from "/lib/supabase.ts";
import { signOut } from "/lib/auth.ts";
import { testReset } from "/lib/rpcs/testReset.ts";
import { testMaxFullfill } from "/lib/rpcs/testMaxFullfill.ts";

import {
  ajouter_auditeur,
  ajouter_editeur,
  commencer_audit,
  creer_collectivite,
  envoyer_demande,
} from "./utils.ts";

import { labellisationDemande } from "/lib/rpcs/labellisationDemande.ts";
import { delay } from "https://deno.land/std@0.163.0/async/delay.ts";
import { saveReponse } from "/lib/rpcs/saveReponse.ts";
import { scoreById } from "../evaluation/scoreById.ts";
import { ClientScores } from "/lib/types/clientScores.ts";

Deno.test(
  "Scénario réponse à `dechets_1` oui -> non pendant un audit",
  async () => {
    await testReset();

    // On crée une collectivité
    const collectivite = await creer_collectivite();

    // En tant qu'éditeur
    // - on déclare toutes les actions faites
    // - on répond `oui` à la question `dechets_1`
    const editeur = await ajouter_editeur(collectivite);
    await supabase.auth.signInWithPassword({
      email: editeur.email,
      password: editeur.password,
    });
    await testMaxFullfill(collectivite.collectivite_id!, "eci");
    const reponseAvantAudit = {
      collectivite_id: collectivite.collectivite_id!,
      question_id: "dechets_1",
      reponse: true,
    };
    await saveReponse(reponseAvantAudit);

    // On attend le calcul des scores et on vérifie la désactivation de `eci_2.4.2`
    await delay(5000);
    let clientScores = await supabase
      .from("client_scores")
      .select()
      .eq("collectivite_id", collectivite.collectivite_id)
      .eq("referentiel", "eci");

    let eci242 = scoreById(
      clientScores.data![0] as unknown as ClientScores,
      "eci_2.4.2",
    );
    assertEquals(
      eci242.desactive,
      false,
      "Avec la compétence 'dechet_1' l'action ne devrait pas être désactivée",
    );

    // On envoie la demande puis on commence l'audit en tant qu'auditeur
    const demandeLabellisation = await envoyer_demande(collectivite, "cot");
    const { auditeur, auditAuditeur } = await ajouter_auditeur(
      collectivite,
      demandeLabellisation,
    );
    await supabase.auth.signInWithPassword({
      email: auditeur.email,
      password: auditeur.password,
    });
    const demande = await labellisationDemande(
      collectivite.collectivite_id!,
      "eci",
    );
    await commencer_audit(auditAuditeur, collectivite, demande, auditeur);

    // En tant qu'éditeur on répond `non` à la question `dechets_1`
    const reponseApresAudit = {
      collectivite_id: collectivite.collectivite_id!,
      question_id: "dechets_1",
      reponse: false,
    };
    await saveReponse(reponseApresAudit);

    await delay(5000);
    clientScores = await supabase
      .from("client_scores")
      .select()
      .eq("collectivite_id", collectivite.collectivite_id)
      .eq("referentiel", "eci");

    eci242 = scoreById(
      clientScores.data![0] as unknown as ClientScores,
      "eci_2.4.2",
    );
    assertEquals(
      eci242.desactive,
      true,
      "Sans la compétence 'dechet_1' l'action devrait être désactivée",
    );

    // On vérifie la vue `comparaison_scores_audit` au niveau du référentiel
    const comparaisonReponse = await supabase
      .from("comparaison_scores_audit")
      .select()
      .eq("collectivite_id", collectivite.collectivite_id)
      .eq("action_id", "eci");

    const comparaisonEci = comparaisonReponse.data![0];

    assertEquals(
      comparaisonEci.courant!.points_max_personnalises,
      465,
      "Sans la compétence 'dechet_1', le potentiel courant du référentiel ECI devrait être 465",
    );
    assertEquals(
      comparaisonEci.pre_audit!.points_max_personnalises,
      500,
      "Avec la compétence 'dechet_1', le potentiel pre-audit du référentiel ECI devrait être 500",
    );

    await signOut();
  },
);

Deno.test(
  "Scénario réponse à `dechets_1` non -> oui pendant un audit",
  async () => {
    await testReset();

    // On crée une collectivité
    const collectivite = await creer_collectivite();

    // En tant qu'éditeur
    // - on déclare toutes les actions faites
    // - on répond `oui` à la question `dechets_1`
    const editeur = await ajouter_editeur(collectivite);
    await supabase.auth.signInWithPassword({
      email: editeur.email,
      password: editeur.password,
    });
    await testMaxFullfill(collectivite.collectivite_id!, "eci");
    const reponseAvantAudit = {
      collectivite_id: collectivite.collectivite_id!,
      question_id: "dechets_1",
      reponse: false,
    };
    await saveReponse(reponseAvantAudit);

    // On attend le calcul des scores et on vérifie la désactivation de `eci_2.4.2`
    await delay(5000);
    let clientScores = await supabase
      .from("client_scores")
      .select()
      .eq("collectivite_id", collectivite.collectivite_id)
      .eq("referentiel", "eci");

    let eci242 = scoreById(
      clientScores.data![0] as unknown as ClientScores,
      "eci_2.4.2",
    );
    assertEquals(
      eci242.desactive,
      true,
      "Sans la compétence 'dechet_1' l'action devrait être désactivée",
    );

    // On envoie la demande puis on commence l'audit en tant qu'auditeur
    const demandeLabellisation = await envoyer_demande(collectivite, "cot");
    const { auditeur, auditAuditeur } = await ajouter_auditeur(
      collectivite,
      demandeLabellisation,
    );
    await supabase.auth.signInWithPassword({
      email: auditeur.email,
      password: auditeur.password,
    });
    const demande = await labellisationDemande(
      collectivite.collectivite_id!,
      "eci",
    );
    await commencer_audit(auditAuditeur, collectivite, demande, auditeur);

    // En tant qu'éditeur on répond `non` à la question `dechets_1`
    const reponseApresAudit = {
      collectivite_id: collectivite.collectivite_id!,
      question_id: "dechets_1",
      reponse: true,
    };
    await saveReponse(reponseApresAudit);

    await delay(5000);
    clientScores = await supabase
      .from("client_scores")
      .select()
      .eq("collectivite_id", collectivite.collectivite_id)
      .eq("referentiel", "eci");

    eci242 = scoreById(
      clientScores.data![0] as unknown as ClientScores,
      "eci_2.4.2",
    );
    assertEquals(
      eci242.desactive,
      false,
      "Avec la compétence 'dechet_1' l'action ne devrait pas être désactivée",
    );

    // On vérifie la vue `comparaison_scores_audit` au niveau du référentiel
    const comparaisonReponse = await supabase
      .from("comparaison_scores_audit")
      .select()
      .eq("collectivite_id", collectivite.collectivite_id)
      .eq("action_id", "eci");

    const comparaisonEci = comparaisonReponse.data![0];

    assertEquals(
      comparaisonEci.pre_audit!.points_max_personnalises,
      465,
      "Sans la compétence 'dechet_1', le potentiel pre-audit  du référentiel ECI devrait être 465",
    );
    assertEquals(
      comparaisonEci.courant!.points_max_personnalises,
      500,
      "Avec la compétence 'dechet_1', le potentiel courant du référentiel ECI devrait être 500",
    );

    await signOut();
  },
);
