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
import { FicheActionVoletGesErrorEnum } from './fiche-action-volet-ges.errors';
import {
  FicheActionVoletGes,
  FicheActionVoletGesRepository,
} from './fiche-action-volet-ges.repository';
import { ficheActionVoletGesTable } from './models/fiche-action-volet-ges.table';

type VoletRow = { ficheId: number; levierId: LevierId };

const toFicheActionVoletGes = (
  ficheId: number,
  ...volets: FicheActionVoletGes['volets']
): FicheActionVoletGes => ({ ficheId, volets });

const veloAmenagement: FicheActionVoletGes['volets'][number] = {
  levier: 'Vélo et transport en commun',
  categorie: 'amenagement',
};

const covoiturageSensibilisation: FicheActionVoletGes['volets'][number] = {
  levier: 'Covoiturage',
  categorie: 'sensibilisation',
};

describe('FicheActionVoletGesRepository.saveVolets', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let repository: FicheActionVoletGesRepository;
  let collectiviteId: number;
  let requesterId: string;
  let ficheId: number;
  let autreFicheId: number;
  let ficheAutreCollectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    const router: TrpcRouter = await getTestRouter(app);
    repository = app.get(FicheActionVoletGesRepository);

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

  const readVolets = async (): Promise<VoletRow[]> =>
    db.db
      .select({
        ficheId: ficheActionVoletGesTable.ficheId,
        levierId: ficheActionVoletGesTable.levierId,
      })
      .from(ficheActionVoletGesTable)
      .where(
        inArray(ficheActionVoletGesTable.ficheId, [
          ficheId,
          autreFicheId,
          ficheAutreCollectiviteId,
        ])
      );

  const registerVoletsCleanup = (): void => {
    onTestFinished(async () => {
      await db.db
        .delete(ficheActionVoletGesTable)
        .where(
          inArray(ficheActionVoletGesTable.ficheId, [
            ficheId,
            autreFicheId,
            ficheAutreCollectiviteId,
          ])
        );
    });
  };

  it("convertit le libellé en identifiant technique et signe l'auteur", async () => {
    registerVoletsCleanup();

    const saveResult = await repository.saveVolets({
      collectiviteId,
      createdBy: requesterId,
      fiches: [toFicheActionVoletGes(ficheId, veloAmenagement)],
    });

    const [row] = await db.db
      .select({
        levierId: ficheActionVoletGesTable.levierId,
        categorie: ficheActionVoletGesTable.categorie,
        createdBy: ficheActionVoletGesTable.createdBy,
      })
      .from(ficheActionVoletGesTable)
      .where(eq(ficheActionVoletGesTable.ficheId, ficheId));

    expect({ saveResult, row }).toEqual({
      saveResult: { success: true, data: undefined },
      row: {
        levierId: 'velo_transport_commun',
        categorie: 'amenagement',
        createdBy: requesterId,
      },
    });
  });

  it('remplace les volets de chaque fiche du lot, sans les cumuler', async () => {
    registerVoletsCleanup();

    await repository.saveVolets({
      collectiviteId,
      createdBy: requesterId,
      fiches: [
        toFicheActionVoletGes(ficheId, veloAmenagement),
        toFicheActionVoletGes(autreFicheId, veloAmenagement),
      ],
    });

    await repository.saveVolets({
      collectiviteId,
      createdBy: requesterId,
      fiches: [
        toFicheActionVoletGes(ficheId, covoiturageSensibilisation),
        toFicheActionVoletGes(autreFicheId),
      ],
    });

    expect(await readVolets()).toEqual([{ ficheId, levierId: 'covoiturage' }]);
  });

  it("efface les volets d'une fiche que le modèle ne rattache à rien", async () => {
    registerVoletsCleanup();

    await repository.saveVolets({
      collectiviteId,
      createdBy: requesterId,
      fiches: [toFicheActionVoletGes(ficheId, veloAmenagement)],
    });
    expect(await readVolets()).toHaveLength(1);

    await repository.saveVolets({
      collectiviteId,
      createdBy: requesterId,
      fiches: [toFicheActionVoletGes(ficheId)],
    });

    expect(await readVolets()).toEqual([]);
  });

  it("laisse les volets precedents intacts quand l'ecriture echoue", async () => {
    registerVoletsCleanup();

    await repository.saveVolets({
      collectiviteId,
      createdBy: requesterId,
      fiches: [toFicheActionVoletGes(ficheId, veloAmenagement)],
    });

    const saveResult = await repository.saveVolets({
      collectiviteId,
      createdBy: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      fiches: [toFicheActionVoletGes(ficheId, covoiturageSensibilisation)],
    });

    expect({ saveResult, rows: await readVolets() }).toEqual({
      saveResult: {
        success: false,
        error: FicheActionVoletGesErrorEnum.SAVE_VOLETS_ERROR,
      },
      rows: [{ ficheId, levierId: 'velo_transport_commun' }],
    });
  });

  it("ne touche pas aux volets d'une fiche qui appartient à une autre collectivité", async () => {
    registerVoletsCleanup();

    await db.db.insert(ficheActionVoletGesTable).values({
      ficheId: ficheAutreCollectiviteId,
      levierId: 'biogaz',
      categorie: 'financement',
      createdBy: requesterId,
    });

    await repository.saveVolets({
      collectiviteId,
      createdBy: requesterId,
      fiches: [
        toFicheActionVoletGes(ficheId, veloAmenagement),
        toFicheActionVoletGes(ficheAutreCollectiviteId, covoiturageSensibilisation),
      ],
    });

    expect(await readVolets()).toEqual([
      { ficheId: ficheAutreCollectiviteId, levierId: 'biogaz' },
      { ficheId, levierId: 'velo_transport_commun' },
    ]);
  });
});
