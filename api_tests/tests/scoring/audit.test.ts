import {
  assertEquals,
  assertExists,
  assertObjectMatch,
} from "https://deno.land/std@0.163.0/testing/asserts.ts";
import { supabase } from "../../lib/supabase.ts";
import { signOut } from "../../lib/auth.ts";
import { testSetCot } from "../../lib/rpcs/testSetCot.ts";
import { testReset } from "../../lib/rpcs/testReset.ts";
import { testFullfill } from "../../lib/rpcs/testFullfill.ts";
import {
  ajouter_auditeur,
  ajouter_editeur,
  commencer_audit,
  creer_collectivite,
  envoyer_demande,
  valider_audit,
  verifier_avant_commencement,
} from "../labellisation/utils.ts";
import { labellisationParcours } from "../../lib/rpcs/labellisationParcours.ts";

await new Promise((r) => setTimeout(r, 0));

Deno.test("Scénario de demande d'audit COT", async () => {
  await testReset();
  const collectivite = await creer_collectivite();
  const editeur = await ajouter_editeur(collectivite);

  // On se connecte avec ses credentials.
  await supabase.auth.signInWithPassword({
    email: editeur.email,
    password: editeur.password,
  });

  // Passe la collectivite en COT
  const cot = await testSetCot(collectivite.collectivite_id!, true);
  assertExists(cot);
  assertObjectMatch(cot, {
    collectivite_id: collectivite.collectivite_id!,
    actif: true,
  });

  // Fait atteindre les critères de scores à la collectivité de test pour les deux référentiels.
  await testFullfill(collectivite.collectivite_id!, "2");
  const demandeLabellisation = await envoyer_demande(collectivite, "cot");
  const { auditeur, auditAuditeur } = await ajouter_auditeur(
    collectivite,
    demandeLabellisation,
  );

  await supabase.auth.signInWithPassword({
    email: auditeur.email,
    password: auditeur.password,
  });

  // On récupère sa liste de collectivité.
  const mesCollectivitesAvantAuditResponse = await supabase
    .from("mes_collectivites")
    .select();
  const collectivitesAvantAudit = mesCollectivitesAvantAuditResponse.data;
  assertExists(collectivitesAvantAudit);
  assertObjectMatch(collectivitesAvantAudit[0], {
    collectivite_id: collectivite.collectivite_id,
    niveau_acces: "edition",
    est_auditeur: false, // l'audit n'est encore commencé
  });

  const demande = await verifier_avant_commencement(collectivite);
  assertExists(demande);
  const auditEnCours = await commencer_audit(
    auditAuditeur,
    collectivite,
    demande!,
    auditeur
  );

  const mesCollectivitesPendantAuditResponse = await supabase
    .from("mes_collectivites")
    .select();
  const collectivitesPendantAudit = mesCollectivitesPendantAuditResponse.data;
  assertExists(collectivitesPendantAudit);
  assertObjectMatch(collectivitesPendantAudit[0], {
    collectivite_id: collectivite.collectivite_id,
    niveau_acces: "edition",
    est_auditeur: true,
  });

  const auditValide = await valider_audit(auditEnCours, collectivite, demande!);

  // Une fois l'audit COT valide, il est clôturé automatiquement.
  assertExists(auditValide.data[0]!.date_fin);

  const auditPlusEnCours = await supabase
    .from("audit_en_cours")
    .select()
    .eq("collectivite_id", collectivite.collectivite_id!)
    .eq("referentiel", "eci");
  assertEquals(auditPlusEnCours!.data!.length, 0);

  await signOut();
});

Deno.test("Scénario de demande d'audit de labellisation", async () => {
  await testReset();

  const collectivite = await creer_collectivite();
  const editeur = await ajouter_editeur(collectivite);

  // On se connecte avec ses credentials.
  await supabase.auth.signInWithPassword({
    email: editeur.email,
    password: editeur.password,
  });

  // Fait atteindre les critères de scores à la collectivité de test pour les deux référentiels.
  await testFullfill(collectivite.collectivite_id!, "2");
  const demandeLabellisation = await envoyer_demande(
    collectivite,
    "labellisation",
    "2",
  );
  const { auditeur, auditAuditeur } = await ajouter_auditeur(
    collectivite,
    demandeLabellisation,
  );

  await supabase.auth.signInWithPassword({
    email: auditeur.email,
    password: auditeur.password,
  });
  const demande = await verifier_avant_commencement(collectivite);
  const auditEnCours = await commencer_audit(
    auditAuditeur,
    collectivite,
    demande,
    auditeur,
  );
  const auditValide = await valider_audit(auditEnCours, collectivite, demande);
  assertEquals(auditValide.data[0]!.date_fin, null);

  const auditToujoursEnCours = await supabase
    .from("audit_en_cours")
    .select()
    .eq("collectivite_id", collectivite.collectivite_id!)
    .eq("referentiel", "eci");
  assertEquals(auditToujoursEnCours!.data!.length, 1);

  await signOut();
});

Deno.test(
  "Scénario de demande labellisation 1ere etoile par collectivite COT",
  async () => {
    await testReset();
    const collectivite = await creer_collectivite();
    const editeur = await ajouter_editeur(collectivite);

    // On se connecte avec ses credentials.
    await supabase.auth.signInWithPassword({
      email: editeur.email,
      password: editeur.password,
    });

    // Passe la collectivite en COT
    const cot = await testSetCot(collectivite.collectivite_id!, true);
    assertExists(cot);
    assertObjectMatch(cot, {
      collectivite_id: collectivite.collectivite_id!,
      actif: true,
    });

    // Fait atteindre les critères de scores à la collectivité de test pour les deux référentiels.
    await testFullfill(collectivite.collectivite_id!, "1");
    const demandeLabellisation = await envoyer_demande(
      collectivite,
      "labellisation",
      "1",
    );
    const { auditeur } = await ajouter_auditeur(
      collectivite,
      demandeLabellisation,
    );

    await supabase.auth.signInWithPassword({
      email: auditeur.email,
      password: auditeur.password,
    });

    // On récupère sa liste de collectivité.
    const mesCollectivitesAvantAuditResponse = await supabase
      .from("mes_collectivites")
      .select();
    const collectivitesAvantAudit = mesCollectivitesAvantAuditResponse.data;
    assertExists(collectivitesAvantAudit);
    assertObjectMatch(collectivitesAvantAudit[0], {
      collectivite_id: collectivite.collectivite_id,
      niveau_acces: "edition",
      est_auditeur: false, // l'audit n'est encore commencé
    });

    const parcours = await labellisationParcours(collectivite.collectivite_id!);
    assertEquals(parcours[0].rempli, true);

    await signOut();
  },
);
