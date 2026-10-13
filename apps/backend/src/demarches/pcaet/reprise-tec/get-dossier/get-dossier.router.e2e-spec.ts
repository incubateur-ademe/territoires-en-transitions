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

describe('demarches.pcaet.repriseTec.getDossier', () => {
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
          melange: true,
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
      ],
      ecarts: [
        {
          tecDossierId,
          tableSource: 'demarche',
          motif: 'sans_place',
          precision: 'population_couverte',
          nombre: 1,
        },
        {
          tecDossierId,
          tableSource: 'action',
          motif: 'doublon',
          precision: '',
          nombre: 3,
        },
      ],
    });
    onTestFinished(cleanup);
    return { ...fixture, tecDossierId };
  };

  test('un super admin lit le dossier, sa démarche, ses écarts et ses spécificités', async () => {
    const { collectiviteId, demarche, tecDossierId } = await addRecette();
    const { caller, cleanup } = await addTestSuperAdmin(app, router);
    onTestFinished(cleanup);

    const recette = await caller.demarches.pcaet.repriseTec.getDossier({
      collectiviteId,
      tecDossierId,
    });

    expect(recette.dossier.tecDossierId).toBe(tecDossierId);
    expect(recette.copie).toEqual({
      tecDossierId: tecDossierId + 1,
      etat: 'definitif',
    });
    expect(recette.demarche?.id).toBe(demarche.id);
    expect(recette.ecarts).toEqual([
      expect.objectContaining({ tableSource: 'action', nombre: 3, section: 1 }),
      expect.objectContaining({
        tableSource: 'demarche',
        precision: 'population_couverte',
        section: 11,
      }),
    ]);
    expect(recette.specificites.map((s) => s.code)).toEqual([
      'copie_fondue',
      'melange',
      'aucun_service',
    ]);
  });

  test("le dossier d'une autre collectivité est introuvable", async () => {
    const { tecDossierId } = await addRecette();
    const autre = await createDemarche(databaseService, router);
    const { caller, cleanup } = await addTestSuperAdmin(app, router);
    onTestFinished(cleanup);

    await expect(
      caller.demarches.pcaet.repriseTec.getDossier({
        collectiviteId: autre.collectiviteId,
        tecDossierId,
      })
    ).rejects.toThrow("La ressource demandée n'existe pas");
  });

  test('un compte sans la permission reçoit un refus', async () => {
    const { collectiviteId, caller, tecDossierId } = await addRecette();

    await expect(
      caller.demarches.pcaet.repriseTec.getDossier({
        collectiviteId,
        tecDossierId,
      })
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });
});
