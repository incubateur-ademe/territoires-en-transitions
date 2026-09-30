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
import { VoletErrorEnum } from './volet.errors';
import { FicheVolets } from './volet.repository';
import { FicheActionVoletGesRepository } from './fiche-action-volet-ges.repository';
import { ficheActionVoletGesTable } from './models/fiche-action-volet-ges.table';

type VoletRow = { ficheId: number; levierId: LevierId };

const toFicheVolets = (
  ficheId: number,
  ...volets: FicheVolets['volets']
): FicheVolets => ({ ficheId, volets });

const veloAmenagement: FicheVolets['volets'][number] = {
  levier: 'Vélo et transport en commun',
  categorie: 'amenagement',
};

const covoiturageSensibilisation: FicheVolets['volets'][number] = {
  levier: 'Covoiturage',
  categorie: 'sensibilisation',
};

let app: INestApplication;
let db: DatabaseService;
let repository: FicheActionVoletGesRepository;
let collectiviteId: number;
let ficheId: number;
let otherFicheId: number;
let otherCollectiviteFicheId: number;
let caller: ReturnType<TrpcRouter['createCaller']>;

beforeAll(async () => {
  app = await getTestApp();
  db = await getTestDatabase(app);
  const router: TrpcRouter = await getTestRouter(app);
  repository = app.get(FicheActionVoletGesRepository);

  const { collectivite, user } = await addTestCollectiviteAndUser(db, {
    user: { role: CollectiviteRole.EDITION },
  });
  collectiviteId = collectivite.id;
  caller = router.createCaller({
    user: getAuthUserFromUserCredentials(user),
  });

  const fiche = await createFicheAndCleanupFunction({
    caller,
    ficheInput: { collectiviteId, titre: 'Aménager des pistes cyclables' },
  });
  ficheId = fiche.ficheId;

  const otherFiche = await createFicheAndCleanupFunction({
    caller,
    ficheInput: { collectiviteId, titre: 'Développer le covoiturage' },
  });
  otherFicheId = otherFiche.ficheId;

  const otherCollectivite = await addTestCollectiviteAndUser(db, {
    user: { role: CollectiviteRole.EDITION },
  });
  const otherCollectiviteFiche = await createFicheAndCleanupFunction({
    caller: router.createCaller({
      user: getAuthUserFromUserCredentials(otherCollectivite.user),
    }),
    ficheInput: {
      collectiviteId: otherCollectivite.collectivite.id,
      titre: 'Fiche de la collectivité voisine',
    },
  });
  otherCollectiviteFicheId = otherCollectiviteFiche.ficheId;

  return async () => {
    await fiche.ficheCleanup();
    await otherFiche.ficheCleanup();
    await otherCollectiviteFiche.ficheCleanup();
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
        otherFicheId,
        otherCollectiviteFicheId,
      ])
    );

const registerVoletsCleanup = (): void => {
  onTestFinished(async () => {
    await db.db
      .delete(ficheActionVoletGesTable)
      .where(
        inArray(ficheActionVoletGesTable.ficheId, [
          ficheId,
          otherFicheId,
          otherCollectiviteFicheId,
        ])
      );
  });
};

describe('FicheActionVoletGesRepository.saveVolets', () => {
  it('convertit le libellé en identifiant technique', async () => {
    registerVoletsCleanup();

    const saveResult = await repository.saveVolets({
      collectiviteId,
      fiches: [toFicheVolets(ficheId, veloAmenagement)],
    });

    const [row] = await db.db
      .select({
        levierId: ficheActionVoletGesTable.levierId,
        categorie: ficheActionVoletGesTable.categorie,
      })
      .from(ficheActionVoletGesTable)
      .where(eq(ficheActionVoletGesTable.ficheId, ficheId));

    expect({ saveResult, row }).toEqual({
      saveResult: { success: true, data: undefined },
      row: {
        levierId: 'velo_transport_commun',
        categorie: 'amenagement',
      },
    });
  });

  it('remplace les volets de chaque fiche du lot, sans les cumuler', async () => {
    registerVoletsCleanup();

    await repository.saveVolets({
      collectiviteId,
      fiches: [
        toFicheVolets(ficheId, veloAmenagement),
        toFicheVolets(otherFicheId, veloAmenagement),
      ],
    });

    await repository.saveVolets({
      collectiviteId,
      fiches: [
        toFicheVolets(ficheId, covoiturageSensibilisation),
        toFicheVolets(otherFicheId),
      ],
    });

    expect(await readVolets()).toEqual([{ ficheId, levierId: 'covoiturage' }]);
  });

  it("efface les volets d'une fiche que le modèle ne rattache à rien", async () => {
    registerVoletsCleanup();

    await repository.saveVolets({
      collectiviteId,
      fiches: [toFicheVolets(ficheId, veloAmenagement)],
    });
    expect(await readVolets()).toHaveLength(1);

    await repository.saveVolets({
      collectiviteId,
      fiches: [toFicheVolets(ficheId)],
    });

    expect(await readVolets()).toEqual([]);
  });

  it("laisse les volets precedents intacts quand l'ecriture echoue", async () => {
    registerVoletsCleanup();

    await repository.saveVolets({
      collectiviteId,
      fiches: [toFicheVolets(ficheId, veloAmenagement)],
    });

    const saveResult = await repository.saveVolets({
      collectiviteId,
      fiches: [
        toFicheVolets(
          ficheId,
          covoiturageSensibilisation,
          covoiturageSensibilisation
        ),
      ],
    });

    expect({ saveResult, rows: await readVolets() }).toEqual({
      saveResult: {
        success: false,
        error: VoletErrorEnum.SAVE_VOLETS_ERROR,
      },
      rows: [{ ficheId, levierId: 'velo_transport_commun' }],
    });
  });

  it("ne touche pas aux volets d'une fiche qui appartient à une autre collectivité", async () => {
    registerVoletsCleanup();

    await db.db.insert(ficheActionVoletGesTable).values({
      ficheId: otherCollectiviteFicheId,
      levierId: 'biogaz',
      categorie: 'financement',
    });

    await repository.saveVolets({
      collectiviteId,
      fiches: [
        toFicheVolets(ficheId, veloAmenagement),
        toFicheVolets(otherCollectiviteFicheId, covoiturageSensibilisation),
      ],
    });

    expect(await readVolets()).toEqual([
      { ficheId: otherCollectiviteFicheId, levierId: 'biogaz' },
      { ficheId, levierId: 'velo_transport_commun' },
    ]);
  });
});

describe('VoletRepository contract', () => {
  it('saveVolets remplace les volets des fiches données, sans auteur', async () => {
    registerVoletsCleanup();

    await repository.saveVolets({
      collectiviteId,
      fiches: [toFicheVolets(ficheId, veloAmenagement)],
    });

    const saveResult = await repository.saveVolets({
      collectiviteId,
      fiches: [toFicheVolets(ficheId, covoiturageSensibilisation)],
    });

    const rows = await db.db
      .select({
        ficheId: ficheActionVoletGesTable.ficheId,
        levierId: ficheActionVoletGesTable.levierId,
        categorie: ficheActionVoletGesTable.categorie,
      })
      .from(ficheActionVoletGesTable)
      .where(eq(ficheActionVoletGesTable.ficheId, ficheId));

    expect({ saveResult, rows }).toEqual({
      saveResult: { success: true, data: undefined },
      rows: [
        {
          ficheId,
          levierId: 'covoiturage',
          categorie: 'sensibilisation',
        },
      ],
    });
  });

  it('listVolets renvoie les volets des fiches de la CT', async () => {
    registerVoletsCleanup();

    await db.db.insert(ficheActionVoletGesTable).values([
      {
        ficheId,
        levierId: 'velo_transport_commun',
        categorie: 'amenagement',
      },
      { ficheId, levierId: 'covoiturage', categorie: 'sensibilisation' },
      {
        ficheId: otherFicheId,
        levierId: 'covoiturage',
        categorie: 'amenagement',
      },
      {
        ficheId: otherCollectiviteFicheId,
        levierId: 'biogaz',
        categorie: 'financement',
      },
    ]);

    expect(await repository.listVolets({ collectiviteId })).toEqual({
      success: true,
      data: [
        { ficheId, levierId: 'covoiturage', categorie: 'sensibilisation' },
        {
          ficheId,
          levierId: 'velo_transport_commun',
          categorie: 'amenagement',
        },
        {
          ficheId: otherFicheId,
          levierId: 'covoiturage',
          categorie: 'amenagement',
        },
      ],
    });
  });

  it('listVolets ne renvoie pas les volets des fiches supprimées en douce', async () => {
    const softDeletedFiche = await createFicheAndCleanupFunction({
      caller,
      ficheInput: { collectiviteId, titre: 'Fiche supprimée en douce' },
    });
    onTestFinished(softDeletedFiche.ficheCleanup);
    registerVoletsCleanup();

    await db.db.insert(ficheActionVoletGesTable).values([
      {
        ficheId,
        levierId: 'velo_transport_commun',
        categorie: 'amenagement',
      },
      {
        ficheId: softDeletedFiche.ficheId,
        levierId: 'covoiturage',
        categorie: 'amenagement',
      },
    ]);
    await caller.plans.fiches.delete({ ficheId: softDeletedFiche.ficheId });

    expect(await repository.listVolets({ collectiviteId })).toEqual({
      success: true,
      data: [
        {
          ficheId,
          levierId: 'velo_transport_commun',
          categorie: 'amenagement',
        },
      ],
    });
  });

  it('deleteVolets supprime les volets des fiches données', async () => {
    registerVoletsCleanup();

    await db.db.insert(ficheActionVoletGesTable).values([
      {
        ficheId,
        levierId: 'velo_transport_commun',
        categorie: 'amenagement',
      },
      { ficheId, levierId: 'covoiturage', categorie: 'sensibilisation' },
      {
        ficheId: otherFicheId,
        levierId: 'covoiturage',
        categorie: 'amenagement',
      },
    ]);

    const deleteResult = await repository.deleteVolets({
      ficheIds: [ficheId, otherFicheId],
    });

    expect({ deleteResult, rows: await readVolets() }).toEqual({
      deleteResult: { success: true, data: undefined },
      rows: [],
    });
  });

  it('deleteVolets ne touche pas aux volets des autres fiches de la CT', async () => {
    registerVoletsCleanup();

    await db.db.insert(ficheActionVoletGesTable).values([
      {
        ficheId,
        levierId: 'velo_transport_commun',
        categorie: 'amenagement',
      },
      {
        ficheId: otherFicheId,
        levierId: 'covoiturage',
        categorie: 'amenagement',
      },
    ]);

    await repository.deleteVolets({ ficheIds: [ficheId] });

    expect(await readVolets()).toEqual([
      { ficheId: otherFicheId, levierId: 'covoiturage' },
    ]);
  });
});
