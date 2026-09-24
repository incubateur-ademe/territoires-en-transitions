import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUsers,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Pertinence, pertinenceEnumValues } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';
import { PertinenceLeviersRepositoryErrorEnum } from './pertinence-leviers.errors';
import { CollectiviteLevierGesPertinenceRepository } from './collectivite-levier-ges-pertinence.repository';

type StoredPertinence = {
  pertinence: Pertinence;
  modifiedBy: string | null;
  isModifiedAtRefreshed: boolean;
};

describe('CollectiviteLevierGesPertinenceRepository', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let repository: CollectiviteLevierGesPertinenceRepository;
  let collectiviteId: number;
  let otherCollectiviteId: number;
  let adminId: string;
  let otherAdminId: string;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    repository = new CollectiviteLevierGesPertinenceRepository(db);

    const { collectivite, users, cleanup } = await addTestCollectiviteAndUsers(
      db,
      {
        users: [
          { role: CollectiviteRole.ADMIN },
          { role: CollectiviteRole.ADMIN },
        ],
      }
    );
    collectiviteId = collectivite.id;
    [adminId, otherAdminId] = users.map((user) => user.id);

    const otherCollectivite = await addTestCollectivite(db);
    otherCollectiviteId = otherCollectivite.collectivite.id;

    return async (): Promise<void> => {
      await cleanup();
      await otherCollectivite.cleanup();
      await app.close();
    };
  });

  const registerPertinencesCleanup = (): void => {
    onTestFinished(async (): Promise<void> => {
      await db.db.execute(
        sql`delete from collectivite_levier_ges_pertinence
            where collectivite_id in (${collectiviteId}, ${otherCollectiviteId})`
      );
    });
  };

  const readStoredPertinences = async (): Promise<StoredPertinence[]> => {
    const storedRows = await db.db.execute<StoredPertinence>(
      sql`select pertinence,
                 modified_by                           as "modifiedBy",
                 modified_at > timestamptz '2000-01-01' as "isModifiedAtRefreshed"
          from collectivite_levier_ges_pertinence
          where collectivite_id = ${collectiviteId}`
    );
    return storedRows.rows;
  };

  it('rend la pertinence posée sur un levier, sans catégorie', async () => {
    registerPertinencesCleanup();

    const upsertResult = await repository.upsert({
      collectiviteId,
      levierId: 'covoiturage',
      pertinence: 'a_discuter',
      modifiedBy: adminId,
    });

    expect({
      upsertResult,
      listResult: await repository.list(collectiviteId),
    }).toStrictEqual({
      upsertResult: { success: true, data: undefined },
      listResult: {
        success: true,
        data: [{ levierId: 'covoiturage', pertinence: 'a_discuter' }],
      },
    });
  });

  it("écrase la valeur, l'auteur et la date d'un levier déjà qualifié, sans créer de seconde ligne", async () => {
    registerPertinencesCleanup();

    await repository.upsert({
      collectiviteId,
      levierId: 'biogaz',
      pertinence: 'pertinent',
      modifiedBy: adminId,
    });
    await db.db.execute(
      sql`update collectivite_levier_ges_pertinence
          set modified_at = timestamptz '2000-01-01'
          where collectivite_id = ${collectiviteId}`
    );
    const storedBeforeOverwrite = await readStoredPertinences();

    await repository.upsert({
      collectiviteId,
      levierId: 'biogaz',
      pertinence: 'non_pertinent',
      modifiedBy: otherAdminId,
    });

    expect({
      storedBeforeOverwrite,
      storedAfterOverwrite: await readStoredPertinences(),
    }).toEqual({
      storedBeforeOverwrite: [
        {
          pertinence: 'pertinent',
          modifiedBy: adminId,
          isModifiedAtRefreshed: false,
        },
      ],
      storedAfterOverwrite: [
        {
          pertinence: 'non_pertinent',
          modifiedBy: otherAdminId,
          isModifiedAtRefreshed: true,
        },
      ],
    });
  });

  it("stocke la pertinence d'une catégorie à côté de celle de son levier", async () => {
    registerPertinencesCleanup();

    await repository.upsert({
      collectiviteId,
      levierId: 'biogaz',
      pertinence: 'a_discuter',
      modifiedBy: adminId,
    });
    await repository.upsert({
      collectiviteId,
      levierId: 'biogaz',
      categorie: 'financement',
      pertinence: 'pertinent',
      modifiedBy: adminId,
    });

    expect({
      listResult: await repository.list(collectiviteId),
      storedCount: (await readStoredPertinences()).length,
    }).toEqual({
      listResult: {
        success: true,
        data: expect.arrayContaining([
          { levierId: 'biogaz', pertinence: 'a_discuter' },
          {
            levierId: 'biogaz',
            categorie: 'financement',
            pertinence: 'pertinent',
          },
        ]),
      },
      storedCount: 2,
    });
  });

  it("efface les catégories d'un levier sans toucher à sa propre pertinence", async () => {
    registerPertinencesCleanup();

    await repository.upsert({
      collectiviteId,
      levierId: 'biogaz',
      pertinence: 'pertinent',
      modifiedBy: adminId,
    });
    await repository.upsert({
      collectiviteId,
      levierId: 'biogaz',
      categorie: 'financement',
      pertinence: 'a_discuter',
      modifiedBy: adminId,
    });

    const deleteResult = await repository.deleteCategoriePertinences({
      collectiviteId,
      levierId: 'biogaz',
    });

    expect({
      deleteResult,
      listResult: await repository.list(collectiviteId),
    }).toStrictEqual({
      deleteResult: { success: true, data: undefined },
      listResult: {
        success: true,
        data: [{ levierId: 'biogaz', pertinence: 'pertinent' }],
      },
    });
  });

  it("stocke la pertinence d'une catégorie dont le levier n'est pas qualifié", async () => {
    registerPertinencesCleanup();

    await repository.upsert({
      collectiviteId,
      levierId: 'gestion_haies',
      categorie: 'sensibilisation',
      pertinence: 'a_discuter',
      modifiedBy: adminId,
    });

    expect(await repository.list(collectiviteId)).toEqual({
      success: true,
      data: [
        {
          levierId: 'gestion_haies',
          categorie: 'sensibilisation',
          pertinence: 'a_discuter',
        },
      ],
    });
  });

  it('ne rend que les pertinences de la collectivité demandée', async () => {
    registerPertinencesCleanup();

    await repository.upsert({
      collectiviteId,
      levierId: 'velo_transport_commun',
      categorie: 'amenagement',
      pertinence: 'pertinent',
      modifiedBy: adminId,
    });
    await repository.upsert({
      collectiviteId: otherCollectiviteId,
      levierId: 'gestion_haies',
      pertinence: 'non_pertinent',
      modifiedBy: adminId,
    });

    expect({
      requested: await repository.list(collectiviteId),
      other: await repository.list(otherCollectiviteId),
    }).toEqual({
      requested: {
        success: true,
        data: [
          {
            levierId: 'velo_transport_commun',
            categorie: 'amenagement',
            pertinence: 'pertinent',
          },
        ],
      },
      other: {
        success: true,
        data: [{ levierId: 'gestion_haies', pertinence: 'non_pertinent' }],
      },
    });
  });

  it("renvoie une erreur quand la collectivité n'existe pas", async () => {
    onTestFinished(async (): Promise<void> => {
      await db.db.execute(
        sql`delete from collectivite_levier_ges_pertinence
            where collectivite_id = -1`
      );
    });

    expect(
      await repository.upsert({
        collectiviteId: -1,
        levierId: 'biogaz',
        pertinence: 'pertinent',
        modifiedBy: adminId,
      })
    ).toEqual({
      success: false,
      error: PertinenceLeviersRepositoryErrorEnum.UPSERT_PERTINENCE_ERROR,
    });
  });

  it("déclare en base les mêmes valeurs de pertinence qu'en TypeScript, dans le même ordre", async () => {
    const enumLabelRows = await db.db.execute<{ label: string }>(
      sql`select e.enumlabel as label
          from pg_enum e
                 join pg_type t on t.oid = e.enumtypid
          where t.typname = 'levier_pertinence'
          order by e.enumsortorder`
    );

    expect(enumLabelRows.rows.map((row) => row.label)).toEqual([
      ...pertinenceEnumValues,
    ]);
  });
});
