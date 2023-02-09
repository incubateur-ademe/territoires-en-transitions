import {
  assertEquals,
  assertExists,
  assertObjectMatch,
} from "https://deno.land/std@0.163.0/testing/asserts.ts";
import { supabase } from "../../lib/supabase.ts";
import { signOut } from "../../lib/auth.ts";
import { testAddRandomUser } from "../../lib/rpcs/testAddRandomUser.ts";
import { RandomUser } from "../../lib/types/randomUser.ts";
import { testCreateCollectivite } from "../../lib/rpcs/testCreateCollectivite.ts";
import { testSetCot } from "../../lib/rpcs/testSetCot.ts";
import { testReset } from "../../lib/rpcs/testReset.ts";
import { testFullfill } from "../../lib/rpcs/testFullfill.ts";
import { testSetAuditeur } from "../../lib/rpcs/testSetAuditeur.ts";
import { labellisationDemande } from "../../lib/rpcs/labellisationDemande.ts";
import {
  labellisationSubmitDemande,
} from "../../lib/rpcs/labellisationSubmitDemande.ts";
import {
  labellisationCommencerAudit,
} from "../../lib/rpcs/labellisationCommencerAudit.ts";
import {
  labellisationParcours,
  TLabellisationDemande,
} from "../../lib/rpcs/labellisationParcours.ts";
import { Database } from "../../lib/database.types.ts";

async function creer_collectivite() {
  // On crée une collectivite de test
  const collectivite = await testCreateCollectivite("Le bois Joli");
  assertExists(collectivite);
  assertObjectMatch(collectivite, {
    nom: "Le bois Joli",
  });
  return collectivite;
}

async function ajouter_editeur(
  collectivite: NonNullable<
    { collectivite_id: number | null; id: number; nom: string }
  >,
) {
  // On crée un utilisateur random, pour la collectivité de test.
  const editeur = await testAddRandomUser(
    collectivite.collectivite_id!,
    "edition",
  );
  assertExists(editeur);
  return editeur;
}

async function envoyer_demande(
  collectivite: NonNullable<
    { collectivite_id: number | null; id: number; nom: string }
  >,
  sujet: Database["labellisation"]["Enums"]["sujet_demande"],
  etoiles?: Database["labellisation"]["Enums"]["etoile"]
) {
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
    "eci",
    sujet,
    etoiles,
  );
  assertExists(demandeLabellisationEnvoyee);
  assertObjectMatch(demandeLabellisationEnvoyee, {
    // en_cours: false,
    collectivite_id: collectivite.collectivite_id!,
    referentiel: "eci",
    etoiles: etoiles ?? null,
    sujet: sujet,
  });
  return demandeLabellisation;
}

async function verifier_avant_commencement(
  collectivite: NonNullable<
    { collectivite_id: number | null; id: number; nom: string }
  >,
) {
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
    // "sujet": "cot",
    // "etoiles": null,
    "en_cours": false,
    "referentiel": "eci",
    "collectivite_id": collectivite.collectivite_id!,
  });

  const auditPasEnCours = await supabase.from("audit_en_cours")
    .select()
    .eq("collectivite_id", collectivite.collectivite_id!)
    .eq("referentiel", "eci");
  assertEquals(auditPasEnCours!.data!.length, 0);
  return demande;
}

async function commencer_audit(
  auditAuditeur: NonNullable<{ audit_id: number; auditeur: string }>,
  collectivite: NonNullable<
    { collectivite_id: number | null; id: number; nom: string }
  >,
  demande: Omit<TLabellisationDemande, "etoiles"> & {
    etoiles: TLabellisationDemande["etoiles"] | null;
  } & {},
  auditeur: RandomUser & {},
) {
  const auditCommence = await labellisationCommencerAudit(
    auditAuditeur.audit_id,
  );
  assertExists(auditCommence);
  assertObjectMatch(auditCommence, {
    // "id"
    "collectivite_id": collectivite.collectivite_id!,
    "referentiel": "eci",
    "demande_id": demande.id,
    // "date_debut"
    "date_fin": null,
    "valide": false,
  });

  const parcours = await labellisationParcours(collectivite.collectivite_id!);
  assertExists(parcours);
  // @ts-ignore
  assertObjectMatch(parcours[0]!.audit, auditCommence);

  const auditEnCours = await supabase.from("audit_en_cours")
    .select("*,auditeurs:audit_auditeur (id:auditeur)")
    .eq("collectivite_id", collectivite.collectivite_id!)
    .eq("referentiel", "eci")
    .limit(1);

  assertExists(auditEnCours);
  assertExists(auditEnCours.data);
  assertObjectMatch(auditEnCours.data[0], {
    // "id": 131,
    "collectivite_id": collectivite.collectivite_id!,
    "referentiel": "eci",
    "demande_id": demande.id,
    // "date_debut": "2023-02-08T08:31:49.250353+00:00",
    "date_fin": null,
    "valide": false,
    "auditeurs": [
      {
        "id": auditeur.user_id,
      },
    ],
  });
  assertExists(auditEnCours.data[0]!.date_debut);
  assertEquals(auditEnCours.data[0]!.date_fin, null);
  return auditEnCours;
}

async function valider_audit(
  // @ts-ignore
  auditEnCours,
  collectivite: NonNullable<
    { collectivite_id: number | null; id: number; nom: string }
  >,
  demande: Omit<TLabellisationDemande, "etoiles"> & {
    etoiles: TLabellisationDemande["etoiles"] | null;
  } & {},
) {
  const auditValide = await supabase.from("audit").update({ valide: true }).eq(
    "id",
    auditEnCours.data![0]!.id,
  ).select();
  assertExists(auditValide);
  assertExists(auditValide.data);
  assertObjectMatch(auditValide.data[0], {
    // "id": 147,
    "collectivite_id": collectivite.collectivite_id!,
    "referentiel": "eci",
    "demande_id": demande.id,
    // "date_debut": "2023-02-08T08:41:26.794506+00:00",
    // "date_fin": "2023-02-08T08:41:26.823115+00:00",
    "valide": true,
  });
  return auditValide;
}

async function ajouter_auditeur(
  collectivite: NonNullable<
    { collectivite_id: number | null; id: number; nom: string }
  >,
  demandeLabellisation: NonNullable<
    {
      collectivite_id: number;
      date: string;
      en_cours: boolean;
      etoiles: Database["labellisation"]["Enums"]["etoile"] | null;
      id: number;
      referentiel: Database["public"]["Enums"]["referentiel"];
      sujet: Database["labellisation"]["Enums"]["sujet_demande"];
    }
  >,
) {
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

  return { auditeur, auditAuditeur };
}

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
  const mesCollectivitesResponse = await supabase
  .from('mes_collectivites')
  .select();
  const collectivites = mesCollectivitesResponse.data;
  assertExists(collectivites);
  assertObjectMatch(collectivites[0], {
    collectivite_id: collectivite.collectivite_id,
    niveau_acces: 'edition',
    est_auditeur: true,
  });

  const demande = await verifier_avant_commencement(collectivite);
  const auditEnCours = await commencer_audit(
    auditAuditeur,
    collectivite,
    demande,
    auditeur,
  );
  const auditValide = await valider_audit(auditEnCours, collectivite, demande);

  // Une fois l'audit COT valide, il est clôturé automatiquement.
  assertExists(auditValide.data[0]!.date_fin);

  const auditPlusEnCours = await supabase.from("audit_en_cours")
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
    "2"
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

  const auditToujoursEnCours = await supabase.from("audit_en_cours")
    .select()
    .eq("collectivite_id", collectivite.collectivite_id!)
    .eq("referentiel", "eci");
  assertEquals(auditToujoursEnCours!.data!.length, 1);

  await signOut();
});
