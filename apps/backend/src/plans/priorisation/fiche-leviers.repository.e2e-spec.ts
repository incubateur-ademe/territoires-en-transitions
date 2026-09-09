import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createFicheAndCleanupFunction } from '@tet/backend/plans/fiches/fiches.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { LevierId } from '@tet/domain/shared';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray } from 'drizzle-orm';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';
import { FicheLeviersErrorEnum } from './fiche-leviers.errors';
import {
  FicheLeviers,
  FicheLeviersRepository,
} from './fiche-leviers.repository';
import { ficheActionLevierTable } from './models/fiche-action-levier.table';

type LevierRow = { ficheId: number; levierId: LevierId };

const toFicheLeviers = (
  ficheId: number,
  ...leviers: FicheLeviers['leviers']
): FicheLeviers => ({ ficheId, leviers });

const veloAmenagement: FicheLeviers['leviers'][number] = {
  levier: 'Vélo et transport en commun',
  categorie: 'amenagement',
};

const covoiturageSensibilisation: FicheLeviers['leviers'][number] = {
  levier: 'Covoiturage',
  categorie: 'sensibilisation',
};

describe('FicheLeviersRepository.saveLeviers', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let repository: FicheLeviersRepository;
  let collectiviteId: number;
  let requesterId: string;
  let ficheId: number;
  let autreFicheId: number;
  let ficheAutreCollectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    const router: TrpcRouter = await getTestRouter(app);
    repository = app.get(FicheLeviersRepository);

    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    collectiviteId = collectivite.id;
    const requester = getAuthUserFromUserCredentials(user);
    requesterId = requester.id;
    const caller = router.createCaller({ user: requester });

    const fiche = await createFicheAndCleanupFunction({
      caller,
      ficheInput: { collectiviteId, titre: 'Aménager des pistes cyclables' },
    });
    ficheId = fiche.ficheId;

    const autreFiche = await createFicheAndCleanupFunction({
      caller,
      ficheInput: { collectiviteId, titre: 'Développer le covoiturage' },
    });
    autreFicheId = autreFiche.ficheId;

    const voisine = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const ficheVoisine = await createFicheAndCleanupFunction({
      caller: router.createCaller({
        user: getAuthUserFromUserCredentials(voisine.user),
      }),
      ficheInput: {
        collectiviteId: voisine.collectivite.id,
        titre: 'Fiche de la collectivité voisine',
      },
    });
    ficheAutreCollectiviteId = ficheVoisine.ficheId;

    return async () => {
      await fiche.ficheCleanup();
      await autreFiche.ficheCleanup();
      await ficheVoisine.ficheCleanup();
      await app.close();
    };
  });

  const readLeviers = async (): Promise<LevierRow[]> =>
    db.db
      .select({
        ficheId: ficheActionLevierTable.ficheId,
        levierId: ficheActionLevierTable.levierId,
      })
      .from(ficheActionLevierTable)
      .where(
        inArray(ficheActionLevierTable.ficheId, [
          ficheId,
          autreFicheId,
          ficheAutreCollectiviteId,
        ])
      );

  const registerLeviersCleanup = (): void => {
    onTestFinished(async () => {
      await db.db
        .delete(ficheActionLevierTable)
        .where(
          inArray(ficheActionLevierTable.ficheId, [
            ficheId,
            autreFicheId,
            ficheAutreCollectiviteId,
          ])
        );
    });
  };

  it("convertit le libellé en identifiant technique et signe l'auteur", async () => {
    registerLeviersCleanup();

    const saveResult = await repository.saveLeviers({
      collectiviteId,
      createdBy: requesterId,
      fiches: [toFicheLeviers(ficheId, veloAmenagement)],
    });

    const [row] = await db.db
      .select({
        levierId: ficheActionLevierTable.levierId,
        categorie: ficheActionLevierTable.categorie,
        createdBy: ficheActionLevierTable.createdBy,
      })
      .from(ficheActionLevierTable)
      .where(eq(ficheActionLevierTable.ficheId, ficheId));

    expect({ saveResult, row }).toEqual({
      saveResult: { success: true, data: undefined },
      row: {
        levierId: 'velo_transport_commun',
        categorie: 'amenagement',
        createdBy: requesterId,
      },
    });
  });

  it('remplace les leviers de chaque fiche du lot, sans les cumuler', async () => {
    registerLeviersCleanup();

    await repository.saveLeviers({
      collectiviteId,
      createdBy: requesterId,
      fiches: [
        toFicheLeviers(ficheId, veloAmenagement),
        toFicheLeviers(autreFicheId, veloAmenagement),
      ],
    });

    await repository.saveLeviers({
      collectiviteId,
      createdBy: requesterId,
      fiches: [
        toFicheLeviers(ficheId, covoiturageSensibilisation),
        toFicheLeviers(autreFicheId),
      ],
    });

    expect(await readLeviers()).toEqual([{ ficheId, levierId: 'covoiturage' }]);
  });

  it("efface les leviers d'une fiche que le modèle ne rattache à rien", async () => {
    registerLeviersCleanup();

    await repository.saveLeviers({
      collectiviteId,
      createdBy: requesterId,
      fiches: [toFicheLeviers(ficheId, veloAmenagement)],
    });
    expect(await readLeviers()).toHaveLength(1);

    await repository.saveLeviers({
      collectiviteId,
      createdBy: requesterId,
      fiches: [toFicheLeviers(ficheId)],
    });

    expect(await readLeviers()).toEqual([]);
  });

  it("laisse les leviers precedents intacts quand l'ecriture echoue", async () => {
    registerLeviersCleanup();

    await repository.saveLeviers({
      collectiviteId,
      createdBy: requesterId,
      fiches: [toFicheLeviers(ficheId, veloAmenagement)],
    });

    const saveResult = await repository.saveLeviers({
      collectiviteId,
      createdBy: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      fiches: [toFicheLeviers(ficheId, covoiturageSensibilisation)],
    });

    expect({ saveResult, rows: await readLeviers() }).toEqual({
      saveResult: {
        success: false,
        error: FicheLeviersErrorEnum.SAVE_LEVIERS_ERROR,
      },
      rows: [{ ficheId, levierId: 'velo_transport_commun' }],
    });
  });

  it("ne touche pas aux leviers d'une fiche qui appartient à une autre collectivité", async () => {
    registerLeviersCleanup();

    await db.db.insert(ficheActionLevierTable).values({
      ficheId: ficheAutreCollectiviteId,
      levierId: 'biogaz',
      categorie: 'financement',
      createdBy: requesterId,
    });

    await repository.saveLeviers({
      collectiviteId,
      createdBy: requesterId,
      fiches: [
        toFicheLeviers(ficheId, veloAmenagement),
        toFicheLeviers(ficheAutreCollectiviteId, covoiturageSensibilisation),
      ],
    });

    expect(await readLeviers()).toEqual([
      { ficheId: ficheAutreCollectiviteId, levierId: 'biogaz' },
      { ficheId, levierId: 'velo_transport_commun' },
    ]);
  });
});
