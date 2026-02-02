import { auditeurTable } from '@tet/backend/referentiels/labellisations/auditeur.table';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  YOLO_DODO,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';

import {
  MesureAuditStatutEnum,
  ReferentielIdEnum,
} from '@tet/domain/referentiels';
import { createAuditWithOnTestFinished } from '../../referentiels.test-fixture';
import { addAuditeurPermission } from '../labellisations.test-fixture';
import { mesureAuditStatutTable } from './mesure-audit-statut.table';

describe('MesureAuditStatutRouter : règles métier', () => {
  let router: TrpcRouter;
  let user: AuthenticatedUser;
  let databaseService: DatabaseService;

  const referentielId = ReferentielIdEnum.CAE;
  const mesureId = 'cae_1.1.1.1';

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
    user = await getAuthUser(YOLO_DODO);
  });

  test('updateStatut puis getStatut retourne le bon statut', async () => {
    const caller = router.createCaller({ user });
    // Création d'un statut pour l'audit en cours
    const statut = {
      collectiviteId: YOLO_DODO.collectiviteId.edition,
      mesureId,
      statut: MesureAuditStatutEnum.EN_COURS,
    } as const;

    // retourne une erreur si pas d'audit en cours
    await expect(
      caller.referentiels.labellisations.updateMesureAuditStatut(statut)
    ).rejects.toThrow('Aucun audit en cours trouvé');

    await expect(
      caller.referentiels.labellisations.getMesureAuditStatut({
        collectiviteId: YOLO_DODO.collectiviteId.edition,
        mesureId,
      })
    ).rejects.toThrow('Aucun audit en cours trouvé');

    const { audit: auditEnCours } = await createAuditWithOnTestFinished({
      databaseService,
      collectiviteId: YOLO_DODO.collectiviteId.edition,
      referentielId,
    });

    // Ajoute le droit d'auditeur sur l'audit en cours
    await addAuditeurPermission({
      databaseService,
      auditId: auditEnCours.id,
      userId: user.id,
    });

    // Retente l'updateStatut
    const updateRes =
      await caller.referentiels.labellisations.updateMesureAuditStatut(statut);

    expect(updateRes).toMatchObject(statut);

    // Lecture du statut
    const getRes =
      await caller.referentiels.labellisations.getMesureAuditStatut({
        collectiviteId: YOLO_DODO.collectiviteId.edition,
        mesureId,
      });

    expect(getRes).toMatchObject(statut);

    // Retente l'updateStatut avec un statut différent
    const updateRes2 =
      await caller.referentiels.labellisations.updateMesureAuditStatut({
        collectiviteId: YOLO_DODO.collectiviteId.edition,
        mesureId,
        statut: MesureAuditStatutEnum.AUDITE,
      });

    expect(updateRes2).toMatchObject({
      statut: MesureAuditStatutEnum.AUDITE,
    });

    // Retente l'updateStatut avec un avis différent
    const updateRes3 =
      await caller.referentiels.labellisations.updateMesureAuditStatut({
        collectiviteId: YOLO_DODO.collectiviteId.edition,
        mesureId,
        avis: 'Nouvel avis',
      });

    expect(updateRes3).toMatchObject({
      avis: 'Nouvel avis',
    });

    // Retente l'updateStatut avec un ordreDuJour différent
    const updateRes4 =
      await caller.referentiels.labellisations.updateMesureAuditStatut({
        collectiviteId: YOLO_DODO.collectiviteId.edition,
        mesureId,
        ordreDuJour: false,
      });

    expect(updateRes4).toMatchObject({
      ordreDuJour: false,
    });
  });

  test('getStatut ne retourne que le statut lié à l’audit en cours', async () => {
    const caller = router.createCaller({ user });

    // Simule un audit clos et un audit en cours pour la même mesure
    const { audit: auditClos } = await createAuditWithOnTestFinished({
      databaseService,
      collectiviteId: YOLO_DODO.collectiviteId.edition,
      referentielId,
      clos: true,
    });

    const { audit: auditEnCours } = await createAuditWithOnTestFinished({
      databaseService,
      collectiviteId: YOLO_DODO.collectiviteId.edition,
      referentielId,
    });

    // Insert un statut pour l'audit clos pour la même mesure
    await databaseService.db.insert(mesureAuditStatutTable).values({
      auditId: auditClos.id,
      collectiviteId: YOLO_DODO.collectiviteId.edition,
      mesureId,
      statut: MesureAuditStatutEnum.AUDITE,
      avis: 'Ancien audit',
      ordreDuJour: false,
      modifiedBy: user.id,
    });

    // Ajoute le droit d'auditeur sur l'audit en cours
    await databaseService.db.insert(auditeurTable).values({
      auditId: auditEnCours.id,
      auditeur: user.id,
    });

    // 2. updateStatut (qui cible l'audit en cours)
    const newStatut = {
      collectiviteId: YOLO_DODO.collectiviteId.edition,
      mesureId,
      statut: MesureAuditStatutEnum.EN_COURS,
      avis: 'Audit en cours',
      ordreDuJour: true,
    } as const;

    await caller.referentiels.labellisations.updateMesureAuditStatut(newStatut);

    // 3. getStatut doit retourner le statut de l'audit en cours
    const getRes2 =
      await caller.referentiels.labellisations.getMesureAuditStatut({
        collectiviteId: YOLO_DODO.collectiviteId.edition,
        mesureId: mesureId,
      });

    expect(getRes2).toMatchObject(newStatut);
  });
});

describe('MesureAuditStatutRouter : permissions', () => {
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  const referentielId = ReferentielIdEnum.CAE;
  const mesureId = 'cae_1.1.1.1';
  const collectiviteId = 99; // id sur lequel YOLO_DODO n'a pas de droits

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
  });

  test('getStatut refuse si non authentifié', async () => {
    const caller = router.createCaller({ user: null });
    await expect(
      caller.referentiels.labellisations.getMesureAuditStatut({
        collectiviteId,
        mesureId,
      })
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('updateStatut refuse si non authentifié', async () => {
    const caller = router.createCaller({ user: null });
    await expect(
      caller.referentiels.labellisations.updateMesureAuditStatut({
        collectiviteId,
        mesureId,
        statut: MesureAuditStatutEnum.EN_COURS,
        avis: '',
        ordreDuJour: false,
      })
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('getStatut refuse si non autorisé', async () => {
    // YOLO_DODO n'a pas de droits sur collectiviteId fictif
    const user = await getAuthUser(YOLO_DODO);
    const caller = router.createCaller({ user });

    await createAuditWithOnTestFinished({
      databaseService,
      collectiviteId,
      referentielId,
    });

    await expect(
      caller.referentiels.labellisations.getMesureAuditStatut({
        collectiviteId,
        mesureId,
      })
    ).rejects.toThrowError(/Droits insuffisants/i);
  });

  test('updateStatut refuse si non auditeur', async () => {
    const user = await getAuthUser(); // YOLO_DODO n'est pas auditeur sur collectiviteId fictif
    const caller = router.createCaller({ user });

    await createAuditWithOnTestFinished({
      databaseService,
      collectiviteId,
      referentielId,
    });

    await expect(
      caller.referentiels.labellisations.updateMesureAuditStatut({
        collectiviteId,
        mesureId,
        statut: MesureAuditStatutEnum.EN_COURS,
        avis: '',
        ordreDuJour: false,
      })
    ).rejects.toThrowError(/Droits insuffisants/i);
  });
});
