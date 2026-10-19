import { INestApplication } from '@nestjs/common';
import { getTestApp, getTestDatabase, getTestRouter } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { createDemarche } from '../../demarches-pcaet.test-fixture';
import {
  addTestLecteurRepriseTec,
  addTestRecette,
  addTestSuperAdmin,
  createTestRecetteTables,
} from '../reprise-tec.test-fixture';

describe('demarches.pcaet.repriseTec.getEntonnoir', () => {
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
          etat: 'en_cours_elaboration',
          melange: false,
          tetDemarcheId: fixture.demarche.id,
        },
        {
          tecDossierId: tecDossierId + 1,
          tecCollectiviteId,
          motif: 'coquille_vide',
          melange: false,
        },
      ],
      ecarts: [
        {
          tecDossierId,
          tableSource: 'demarche',
          motif: 'elu_referent_texte_libre',
          precision: 'elu_referent',
          nombre: 1,
        },
      ],
    });
    onTestFinished(cleanup);
    return { ...fixture, tecDossierId };
  };

  test('un super admin lit la recette', async () => {
    const { tecDossierId } = await addRecette();
    const { caller, cleanup } = await addTestSuperAdmin(app, router);
    onTestFinished(cleanup);

    const resultat = await caller.demarches.pcaet.repriseTec.getEntonnoir();

    expect(resultat.total).toBeGreaterThanOrEqual(2);
    expect(resultat.flux).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          etat: 'en_cours_elaboration',
          statut: 'en_elaboration',
        }),
        expect.objectContaining({ statut: null, motif: 'coquille_vide' }),
      ])
    );
    expect(tecDossierId).toBeGreaterThan(0);
  });

  test('un compte avec le rôle de lecture de la reprise lit la recette', async () => {
    await addRecette();
    const { caller, cleanup } = await addTestLecteurRepriseTec(app, router);
    onTestFinished(cleanup);

    const resultat = await caller.demarches.pcaet.repriseTec.getEntonnoir();

    expect(resultat.total).toBeGreaterThanOrEqual(2);
  });

  test('un compte sans la permission reçoit un refus', async () => {
    const { caller } = await addRecette();

    await expect(
      caller.demarches.pcaet.repriseTec.getEntonnoir()
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });
});
