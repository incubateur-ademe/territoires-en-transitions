import { pickFreeRegionCode } from '@tet/backend/demarches/pcaet/demarches-pcaet.test-fixture';
import { pcaetDemandeAvisTable } from '@tet/backend/demarches/pcaet/shared/models/pcaet-demande-avis.table';
import { demarchePlanActionTable } from '@tet/backend/demarches/shared/models/demarche-plan-action.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { DemarchePcaetStatus } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import type { Collectivites } from 'tests/collectivite/collectivites.fixture';
import { databaseService } from 'tests/shared/database.service';

/**
 * Données de démarches PCAET écrites directement en base : les tests qui s'en
 * servent portent sur ce qui suit une étape (instruction, téléchargements…),
 * pas sur l'étape elle-même, déjà éprouvée par le parcours de bout en bout.
 */

/**
 * Un service instructeur (DREAL) et son agent, connecté. Un index unique
 * interdit deux DREAL sur la même région : le code est choisi parmi ceux que la
 * base n'utilise pas, et renvoyé pour y placer les collectivités instruites.
 */
export const createServiceInstructeur = async (
  collectivites: Collectivites,
  { nom }: { nom: string }
) => {
  const regionCode = await pickFreeRegionCode(databaseService, 'dreal');
  const { collectivite } = await collectivites.addCollectiviteAndUser({
    collectiviteArgs: { type: 'dreal', regionCode, nom },
    userArgs: { role: CollectiviteRole.ADMIN, autoLogin: true },
  });
  return { serviceId: collectivite.data.id, regionCode };
};

/**
 * Une démarche PCAET soumise. `demarche_active_unique` n'autorise qu'un
 * dossier actif (`en_elaboration` ou `transmis_pour_avis`) par collectivité.
 */
export const createDemarcheTransmise = async ({
  collectiviteId,
  status = 'transmis_pour_avis',
  titre = 'PCAET transmis e2e',
  transmittedAt = new Date(),
}: {
  collectiviteId: number;
  status?: DemarchePcaetStatus;
  titre?: string;
  transmittedAt?: Date;
}) => {
  const [demarche] = await databaseService.db
    .insert(demarcheTable)
    .values({
      collectiviteId,
      type: 'pcaet',
      titre,
      status,
      transmittedAt: transmittedAt.toISOString(),
      publishedAt: status === 'publie' ? new Date().toISOString() : null,
    })
    .returning({ id: demarcheTable.id });
  return demarche.id;
};

/** Un plan (axe racine) de la collectivité, rattaché à la démarche. */
export const attachPlanToDemarche = async ({
  demarcheId,
  collectiviteId,
  nom = 'Programme d’actions e2e',
}: {
  demarcheId: number;
  collectiviteId: number;
  nom?: string;
}) => {
  const [plan] = await databaseService.db
    .insert(axeTable)
    .values({ nom, collectiviteId })
    .returning({ id: axeTable.id });
  await databaseService.db
    .insert(demarchePlanActionTable)
    .values({ demarcheId, planActionId: plan.id });
  return plan.id;
};

/** La saisine d'un service sur une démarche transmise. */
export const addSaisine = async ({
  demarcheId,
  serviceId,
}: {
  demarcheId: number;
  serviceId: number;
}) => {
  const [demande] = await databaseService.db
    .insert(pcaetDemandeAvisTable)
    .values({
      demarcheId,
      instructeurCollectiviteId: serviceId,
      source: 'seed',
    })
    .returning({ id: pcaetDemandeAvisTable.id });
  return demande.id;
};

/**
 * Un dossier à instruire : un service (DREAL) connecté, une collectivité de sa
 * région qui a transmis son PCAET, et la saisine du service sur ce dépôt.
 */
export const createDossierSaisi = async (
  collectivites: Collectivites,
  {
    nom,
    status,
    titre,
  }: {
    /** Suffixe des noms du service et de la déposante. */
    nom: string;
    status?: DemarchePcaetStatus;
    titre?: string;
  }
) => {
  const { serviceId, regionCode } = await createServiceInstructeur(
    collectivites,
    { nom: `DREAL ${nom}` }
  );
  const deposante = await collectivites.addCollectivite({
    regionCode,
    departementCode: '54',
    nom: `Deposante ${nom}`,
  });
  const deposanteId = deposante.data.id;
  const demarcheId = await createDemarcheTransmise({
    collectiviteId: deposanteId,
    status,
    titre,
  });
  const demandeAvisId = await addSaisine({ demarcheId, serviceId });
  return { serviceId, deposanteId, demarcheId, demandeAvisId };
};
