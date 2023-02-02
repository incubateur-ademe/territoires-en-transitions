import {
  assertEquals,
  assertExists,
  assertMatch,
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

Deno.test("Creation d'un utilisateur pour une collectivité", async () => {
  await testReset();

  // On crée une collectivite de test
  const collectivite = await testCreateCollectivite("Le bois Joli");
  assertExists(collectivite);
  assertObjectMatch(collectivite, {
    nom: "Le bois Joli",
  });

  // On crée un utilisateur random, pour la collectivité de test.
  const user = await testAddRandomUser(collectivite.collectivite_id!, "edition");
  assertExists(user);

  // On se connecte avec ses credentials.
  await supabase.auth.signInWithPassword(
    { email: user.email, password: user.password },
  );

  const isAnyRoleOn = await supabase.rpc("is_any_role_on", {
    id: collectivite.collectivite_id!,
  }).single();
  assertEquals(isAnyRoleOn!.data, true);

  // On récupère sa liste de collectivité.
  const mesCollectivitesResponse = await supabase
    .from("mes_collectivites")
    .select();
  const collectivites = mesCollectivitesResponse.data;
  assertExists(collectivites);
  assertObjectMatch(collectivites[0], {
    collectivite_id: collectivite.collectivite_id!,
    niveau_acces: "edition",
    est_auditeur: false,
  });

  // Passe la collectivite en COT
  const cot = await testSetCot(collectivite.collectivite_id!, true);
  assertExists(cot);
  assertObjectMatch(cot, {'collectivite_id': collectivite.collectivite_id!, 'actif': true });

  // Fait atteindre les critères de scores à la collectivité de test pour les deux référentiels.
  await testFullfill(collectivite.collectivite_id!, '2');

  // Obtient la demande de labellisation.
  const demandeLabellisation = await labellisationDemande(collectivite.collectivite_id!, 'eci', '2');
  assertExists(demandeLabellisation)
  assertObjectMatch(demandeLabellisation,
    {
      collectivite_id: collectivite.collectivite_id!,
      en_cours: true,
      referentiel: "eci",
      etoiles: "2",
    }
  );

  const auditAuditeur = await testSetAuditeur(demandeLabellisation.id!, user.user_id);
  assertExists(auditAuditeur);
  console.log(auditAuditeur);

  await signOut();
});
