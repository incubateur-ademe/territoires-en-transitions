import {
  assertEquals,
  assertExists,
  assertObjectMatch,
} from "https://deno.land/std@0.163.0/testing/asserts.ts";
import { supabase } from "../../lib/supabase.ts";
import { signOut } from "../../lib/auth.ts";
import { testAddRandomUser } from "../../lib/rpcs/testAddRandomUser.ts";
import { testCreateCollectivite } from "../../lib/rpcs/testCreateCollectivite.ts";
import { testSetCot } from "../../lib/rpcs/testSetCot.ts";
import { testReset } from "../../lib/rpcs/testReset.ts";
import { testFullfill } from "../../lib/rpcs/testFullfill.ts";
import { testSetAuditeur } from "../../lib/rpcs/testSetAuditeur.ts";
import { labellisationDemande } from "../../lib/rpcs/labellisationDemande.ts";
import { labellisationSubmitDemande } from "../../lib/rpcs/labellisationSubmitDemande.ts";
import { labellisationCommencerAudit } from "../../lib/rpcs/labellisationCommencerAudit.ts";
import { labellisationParcours } from "../../lib/rpcs/labellisationParcours.ts";

Deno.test("Scénario de demande d'audit", async () => {
  await testReset();

  // On crée une collectivite de test
  const collectivite = await testCreateCollectivite("Le bois Joli");
  assertExists(collectivite);
  assertObjectMatch(collectivite, {
    nom: "Le bois Joli",
  });

  // On crée un utilisateur random, pour la collectivité de test.
  const editeur = await testAddRandomUser(
    collectivite.collectivite_id!,
    "edition",
  );
  assertExists(editeur);

  // On se connecte avec ses credentials.
  await supabase.auth.signInWithPassword({
    email: editeur.email,
    password: editeur.password,
  });

  const isAnyRoleOn = await supabase
    .rpc("is_any_role_on", {
      id: collectivite.collectivite_id!,
    })
    .single();
  assertEquals(isAnyRoleOn!.data, true);

  // Passe la collectivite en COT
  const cot = await testSetCot(collectivite.collectivite_id!, true);
  assertExists(cot);
  assertObjectMatch(cot, {
    collectivite_id: collectivite.collectivite_id!,
    actif: true,
  });

  // Fait atteindre les critères de scores à la collectivité de test pour les deux référentiels.
  await testFullfill(collectivite.collectivite_id!, "2");

  // Obtient la demande de labellisation.
  const demandeLabellisation = await labellisationDemande(
    collectivite.collectivite_id!,
    "eci",
  );
  assertExists(demandeLabellisation);
  assertObjectMatch(demandeLabellisation, {
    collectivite_id: collectivite.collectivite_id!,
    // en_cours: true,
    referentiel: "eci",
  });

  // l'éditeur valide la demande (envoyer la demande).
  const demandeLabellisationEnvoyee = await labellisationSubmitDemande(
    collectivite.collectivite_id!,
    'eci',
    'cot',
    undefined
  );
  assertExists(demandeLabellisationEnvoyee);
  assertObjectMatch(demandeLabellisationEnvoyee, {
    // en_cours: false,
    collectivite_id: collectivite.collectivite_id!,
    referentiel: "eci",
    etoiles: null,
    sujet: "cot"
  });

  // Créé un auditeur
  const auditeur = await testAddRandomUser(
    collectivite.collectivite_id!,
    "edition",
  );
  assertExists(auditeur);

  const auditAuditeur = await testSetAuditeur(
    demandeLabellisation.id!,
    auditeur.user_id,
  );
  assertExists(auditAuditeur);
  assertEquals(auditeur.user_id, auditAuditeur.auditeur);

  console.log(auditeur, auditAuditeur)

  await supabase.auth.signInWithPassword({
    email: auditeur.email,
    password: auditeur.password,
  });

  const parcours = await labellisationParcours(collectivite.collectivite_id!);
  assertExists(parcours);
  assertObjectMatch(parcours[0], {
    "referentiel": "eci",
    "etoiles": "2",
    "completude_ok": true,
     // "demande": ...
    "labellisation": null,
  });

  const demande = parcours[0]!.demande;
  assertExists(demande);
  assertObjectMatch(demande, {
    // "id": 49,
    // "date": "2023-02-07T19:30:56.554121+00:00",
    "sujet": "cot",
    "etoiles": null,
    "en_cours": false,
    "referentiel": "eci",
    "collectivite_id": collectivite.collectivite_id!
  })

  const auditCommence = await labellisationCommencerAudit(auditAuditeur.audit_id)
  assertExists(auditCommence);
  assertObjectMatch(auditCommence,
    {
      // "id"
      "collectivite_id": collectivite.collectivite_id!,
      "referentiel": "eci",
      "demande_id": demande.id,
      // "date_debut"
      "date_fin": null,
      "valide": false
    });

  await signOut();
});
