import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createFicheAndCleanupFunction } from '@tet/backend/plans/fiches/fiches.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { beforeAll, describe, expect, it } from 'vitest';
import { FicheAxePathRepository } from './fiche-axe-path.repository';

describe('FicheAxePathRepository contract', () => {
  let app: INestApplication;
  let repository: FicheAxePathRepository;
  let ficheInSousAxeId: number;
  let ficheInTwoAxesId: number;
  let ficheWithoutAxeId: number;

  beforeAll(async () => {
    app = await getTestApp();
    const db = await getTestDatabase(app);
    const router: TrpcRouter = await getTestRouter(app);
    repository = app.get(FicheAxePathRepository);

    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });

    const plan = await caller.plans.plans.create({
      nom: 'PCAET 2024-2030',
      collectiviteId: collectivite.id,
    });
    const axe = await caller.plans.axes.create({
      nom: 'Mobilité',
      collectiviteId: collectivite.id,
      planId: plan.id,
      parent: plan.id,
    });
    const sousAxe = await caller.plans.axes.create({
      nom: 'Mobilités douces',
      collectiviteId: collectivite.id,
      planId: plan.id,
      parent: axe.id,
    });

    const [ficheInSousAxe, ficheInTwoAxes, ficheWithoutAxe] =
      await Promise.all([
        createFicheAndCleanupFunction({
          caller,
          ficheInput: {
            collectiviteId: collectivite.id,
            titre: 'Aménager des pistes cyclables',
            axeId: sousAxe.id,
          },
        }),
        createFicheAndCleanupFunction({
          caller,
          ficheInput: {
            collectiviteId: collectivite.id,
            titre: 'Développer le covoiturage',
          },
        }),
        createFicheAndCleanupFunction({
          caller,
          ficheInput: {
            collectiviteId: collectivite.id,
            titre: 'Fiche sans axe',
          },
        }),
      ]);
    await caller.plans.fiches.update({
      ficheId: ficheInTwoAxes.ficheId,
      ficheFields: { axes: [{ id: sousAxe.id }, { id: axe.id }] },
      isNotificationEnabled: false,
    });
    ficheInSousAxeId = ficheInSousAxe.ficheId;
    ficheInTwoAxesId = ficheInTwoAxes.ficheId;
    ficheWithoutAxeId = ficheWithoutAxe.ficheId;

    return async () => {
      await ficheInSousAxe.ficheCleanup();
      await ficheInTwoAxes.ficheCleanup();
      await ficheWithoutAxe.ficheCleanup();
      await app.close();
    };
  });

  it('renvoie le chemin du plan jusqu’à l’axe de la fiche', async () => {
    const pathsResult = await repository.listFicheAxePaths({
      ficheIds: [ficheInSousAxeId],
    });

    expect(pathsResult).toEqual({
      success: true,
      data: [
        {
          ficheId: ficheInSousAxeId,
          axePaths: [['PCAET 2024-2030', 'Mobilité', 'Mobilités douces']],
        },
      ],
    });
  });

  it('renvoie les chemins triés d’une fiche rattachée à deux axes', async () => {
    const pathsResult = await repository.listFicheAxePaths({
      ficheIds: [ficheInTwoAxesId],
    });

    expect(pathsResult).toEqual({
      success: true,
      data: [
        {
          ficheId: ficheInTwoAxesId,
          axePaths: [
            ['PCAET 2024-2030', 'Mobilité'],
            ['PCAET 2024-2030', 'Mobilité', 'Mobilités douces'],
          ],
        },
      ],
    });
  });

  it('renvoie une liste vide pour une fiche sans axe', async () => {
    const pathsResult = await repository.listFicheAxePaths({
      ficheIds: [ficheWithoutAxeId],
    });

    expect(pathsResult).toEqual({
      success: true,
      data: [{ ficheId: ficheWithoutAxeId, axePaths: [] }],
    });
  });

  it('ne renvoie rien sans identifiant de fiche', async () => {
    const pathsResult = await repository.listFicheAxePaths({ ficheIds: [] });

    expect(pathsResult).toEqual({ success: true, data: [] });
  });
});
