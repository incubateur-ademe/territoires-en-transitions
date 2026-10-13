import { INestApplication } from '@nestjs/common';
import { getTestApp, getTestDatabase, getTestRouter } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { createDemarche } from '../../demarches-pcaet.test-fixture';
import {
  addTestRecette,
  addTestSuperAdmin,
  createTestRecetteTables,
} from '../reprise-tec.test-fixture';

describe('demarches.pcaet.repriseTec.getCollectivite', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
    await createTestRecetteTables(databaseService);

    return async () => {
      await app.close();
    };
  });

  const addRecette = async () => {
    const fixture = await createDemarche(databaseService, router);
    const tecCollectiviteId = 900_000_000 + fixture.collectiviteId;
    const tecDossierId = 900_000_000 + fixture.collectiviteId * 10;
    const { cleanup } = await addTestRecette(databaseService, {
      collectivite: {
        tecCollectiviteId,
        tetCollectiviteId: fixture.collectiviteId,
        nom: 'Collectivité de T&C',
      },
      dossiers: [
        {
          tecDossierId,
          tecCollectiviteId,
          nom: 'Dossier repris',
          etat: 'mise_en_oeuvre',
          melange: false,
          tetDemarcheId: fixture.demarche.id,
        },
        {
          tecDossierId: tecDossierId + 1,
          tecCollectiviteId,
          definitifDe: tecDossierId,
          etat: 'definitif',
          motif: 'doublon',
          melange: false,
        },
        {
          tecDossierId: tecDossierId + 2,
          tecCollectiviteId,
          motif: 'coquille_vide',
          melange: false,
        },
      ],
    });
    onTestFinished(cleanup);
    return { ...fixture, tecCollectiviteId, tecDossierId };
  };

  test('un super admin lit les dossiers, la copie fondue et le statut TeT', async () => {
    const { collectiviteId, demarche, tecDossierId } = await addRecette();
    const { caller, cleanup } = await addTestSuperAdmin(app, router);
    onTestFinished(cleanup);

    const recette = await caller.demarches.pcaet.repriseTec.getCollectivite({
      collectiviteId,
    });

    expect(recette.collectivite.id).toBe(collectiviteId);
    expect(recette.tec).toHaveLength(1);
    expect(recette.dossiers).toEqual([
      expect.objectContaining({
        tecDossierId,
        copieId: tecDossierId + 1,
        demarcheId: demarche.id,
        statut: demarche.status,
      }),
      expect.objectContaining({
        tecDossierId: tecDossierId + 2,
        motif: 'coquille_vide',
        demarcheId: null,
        statut: null,
      }),
    ]);
  });

  test('une collectivité absente de la recette est introuvable', async () => {
    const { collectiviteId } = await createDemarche(databaseService, router);
    const { caller, cleanup } = await addTestSuperAdmin(app, router);
    onTestFinished(cleanup);

    await expect(
      caller.demarches.pcaet.repriseTec.getCollectivite({ collectiviteId })
    ).rejects.toThrow("La ressource demandée n'existe pas");
  });

  test('un compte sans la permission reçoit un refus', async () => {
    const { collectiviteId, caller } = await addRecette();

    await expect(
      caller.demarches.pcaet.repriseTec.getCollectivite({ collectiviteId })
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });
});
