import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUser,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  YOLO_DODO,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { createFiche } from '../fiches.test-fixture';
import { FicheExportPayloadService } from './fiche-export-payload.service';

let app: INestApplication;
let router: TrpcRouter;
let payloadService: FicheExportPayloadService;
let yoloDodo: AuthenticatedUser;

const COLLECTIVITE_ID = YOLO_DODO.collectiviteId.admin;

beforeAll(async () => {
  app = await getTestApp();
  router = await getTestRouter(app);
  payloadService = app.get(FicheExportPayloadService);
  yoloDodo = await getAuthUser(YOLO_DODO);
});

describe('buildFicheExportPayload - fiches liées', () => {
  it('inclut une fiche liée mais jamais ses sous-fiches', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const ficheLieeId = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Fiche liée parente',
      },
    });

    await createFiche({
      caller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Sous-fiche de la fiche liée',
        parentId: ficheLieeId,
      },
    });

    const ficheId = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Fiche exportée',
      },
    });

    await caller.plans.fiches.update({
      ficheId,
      ficheFields: { fichesLiees: [{ id: ficheLieeId }] },
      isNotificationEnabled: false,
    });

    const result = await payloadService.buildFicheExportPayload({
      ficheId,
      user: yoloDodo,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.fichesLiees.map((ficheLiee) => ficheLiee.id)).toEqual([
      ficheLieeId,
    ]);
  }, 30_000);

  it("n'inclut pas une fiche liée qui est une sous-action", async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const parentId = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Fiche parente',
      },
    });

    const sousActionLieeId = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Sous-action ensuite liée',
        parentId,
      },
    });

    const ficheId = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Fiche exportée liée à une sous-action',
      },
    });

    await caller.plans.fiches.update({
      ficheId,
      ficheFields: { fichesLiees: [{ id: sousActionLieeId }] },
      isNotificationEnabled: false,
    });

    const result = await payloadService.buildFicheExportPayload({
      ficheId,
      user: yoloDodo,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.fichesLiees.map((ficheLiee) => ficheLiee.id)).toEqual(
      []
    );
  }, 30_000);

  it("inclut une fiche liée même quand le lien a été créé depuis l'autre fiche", async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const ficheId = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Fiche exportée (cible du lien)',
      },
    });

    const ficheSourceId = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Fiche qui initie le lien',
      },
    });

    await caller.plans.fiches.update({
      ficheId: ficheSourceId,
      ficheFields: { fichesLiees: [{ id: ficheId }] },
      isNotificationEnabled: false,
    });

    const result = await payloadService.buildFicheExportPayload({
      ficheId,
      user: yoloDodo,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.fichesLiees.map((ficheLiee) => ficheLiee.id)).toEqual([
      ficheSourceId,
    ]);
  }, 30_000);
});

describe('buildFicheExportPayload - sous-actions', () => {
  const sousActionIdsExportees = async (
    ficheId: number,
    user: AuthenticatedUser
  ) => {
    const result = await payloadService.buildFicheExportPayload({
      ficheId,
      user,
    });
    if (!result.success) throw new Error(result.error);
    return result.data.sousActions.map((sousAction) => sousAction.id);
  };

  it('inclut les sous-actions lisibles, par ordre de création, sans les supprimées', async () => {
    const db = await getTestDatabase(app);
    const { collectivite, user: admin } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const adminUser = getAuthUserFromUserCredentials(admin);
    const caller = router.createCaller({ user: adminUser });
    const create = (titre: string, fields = {}) =>
      createFiche({
        caller,
        ficheInput: { collectiviteId: collectivite.id, titre, ...fields },
      });

    const ficheId = await create('Fiche exportée');
    const premiereId = await create('Première', { parentId: ficheId });
    const restreinteId = await create('Restreinte', {
      parentId: ficheId,
      restreint: true,
    });
    const supprimeeId = await create('Supprimée', { parentId: ficheId });
    await caller.plans.fiches.delete({ ficheId: supprimeeId });

    expect(await sousActionIdsExportees(ficheId, adminUser)).toEqual([
      premiereId,
      restreinteId,
    ]);

    // Un visiteur non membre ne voit pas la sous-action restreinte.
    const { user } = await addTestUser(db);
    const visiteur = getAuthUserFromUserCredentials(user);
    expect(await sousActionIdsExportees(ficheId, visiteur)).toEqual([
      premiereId,
    ]);
  }, 30_000);
});
