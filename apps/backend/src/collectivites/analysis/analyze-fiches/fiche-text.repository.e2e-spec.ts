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
import { FicheTextRepository } from './fiche-text.repository';

describe('FicheTextRepository contract', () => {
  let app: INestApplication;
  let repository: FicheTextRepository;
  let describedFicheId: number;
  let ficheWithoutDescriptionId: number;
  let deletedFicheId: number;

  beforeAll(async () => {
    app = await getTestApp();
    const db = await getTestDatabase(app);
    const router: TrpcRouter = await getTestRouter(app);
    repository = app.get(FicheTextRepository);

    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });

    const [describedFiche, ficheWithoutDescription, deletedFiche] =
      await Promise.all([
        createFicheAndCleanupFunction({
          caller,
          ficheInput: {
            collectiviteId: collectivite.id,
            titre: 'Aménager des pistes cyclables',
            description: 'Dix km de pistes',
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
            titre: 'Fiche supprimée',
          },
        }),
      ]);
    describedFicheId = describedFiche.ficheId;
    ficheWithoutDescriptionId = ficheWithoutDescription.ficheId;
    deletedFicheId = deletedFiche.ficheId;
    await deletedFiche.ficheCleanup();

    return async () => {
      await describedFiche.ficheCleanup();
      await ficheWithoutDescription.ficheCleanup();
      await app.close();
    };
  });

  it('renvoie le titre et la description des fiches demandées', async () => {
    const textsResult = await repository.listFicheTexts({
      ficheIds: [describedFicheId],
    });

    expect(textsResult).toEqual({
      success: true,
      data: [
        {
          ficheId: describedFicheId,
          titre: 'Aménager des pistes cyclables',
          description: 'Dix km de pistes',
        },
      ],
    });
  });

  it('renvoie null pour une fiche sans description', async () => {
    const textsResult = await repository.listFicheTexts({
      ficheIds: [ficheWithoutDescriptionId],
    });

    expect(textsResult).toEqual({
      success: true,
      data: [
        {
          ficheId: ficheWithoutDescriptionId,
          titre: 'Développer le covoiturage',
          description: null,
        },
      ],
    });
  });

  it("ne renvoie rien pour un identifiant de fiche qui n'existe plus", async () => {
    const textsResult = await repository.listFicheTexts({
      ficheIds: [describedFicheId, deletedFicheId],
    });

    expect(textsResult).toEqual({
      success: true,
      data: [
        {
          ficheId: describedFicheId,
          titre: 'Aménager des pistes cyclables',
          description: 'Dix km de pistes',
        },
      ],
    });
  });
});
