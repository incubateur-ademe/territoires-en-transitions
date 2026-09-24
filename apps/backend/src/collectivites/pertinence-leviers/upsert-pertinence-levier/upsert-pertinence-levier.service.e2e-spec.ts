import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { PertinenceLevier } from '@tet/domain/collectivites';
import { categorieActionEnumValues } from '@tet/domain/shared';
import { CollectiviteRole } from '@tet/domain/users';
import { sortBy } from 'es-toolkit';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';
import { CollectiviteLevierGesPertinenceRepository } from '../collectivite-levier-ges-pertinence.repository';
import { EnjeuPertinencesRepositories } from '../enjeu-pertinences.repositories';
import {
  PertinenceLeviersRepositoryErrorEnum,
  type PertinenceLeviersRepositoryError,
} from '../pertinence-leviers.errors';
import { UpsertPertinenceLevierService } from './upsert-pertinence-levier.service';

class FailingUpsertRepository extends CollectiviteLevierGesPertinenceRepository {
  async upsert(): Promise<Result<void, PertinenceLeviersRepositoryError>> {
    return failure(
      PertinenceLeviersRepositoryErrorEnum.UPSERT_PERTINENCE_ERROR
    );
  }
}

describe('UpsertPertinenceLevierService', { timeout: 30_000 }, () => {
  let app: INestApplication;
  let db: DatabaseService;
  let repository: CollectiviteLevierGesPertinenceRepository;
  let service: UpsertPertinenceLevierService;
  let serviceWithFailingUpsert: UpsertPertinenceLevierService;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    repository = new CollectiviteLevierGesPertinenceRepository(db);
    service = app.get(UpsertPertinenceLevierService);
    serviceWithFailingUpsert = new UpsertPertinenceLevierService(
      app.get(TransactionManager),
      app.get(PermissionService),
      new EnjeuPertinencesRepositories(new FailingUpsertRepository(db))
    );

    return async (): Promise<void> => {
      await app.close();
    };
  });

  const addCollectiviteWithAdmin = async (): Promise<{
    collectiviteId: number;
    admin: AuthenticatedUser;
  }> => {
    const { collectivite, user, cleanup } = await addTestCollectiviteAndUser(
      db,
      { user: { role: CollectiviteRole.ADMIN } }
    );
    onTestFinished(cleanup);
    return {
      collectiviteId: collectivite.id,
      admin: getAuthUserFromUserCredentials(user),
    };
  };

  const listSortedPertinences = async (
    collectiviteId: number
  ): Promise<PertinenceLevier[]> => {
    const listResult = await repository.list(collectiviteId);
    if (!listResult.success) {
      throw new Error(listResult.error);
    }
    return sortBy(listResult.data, [
      ({ levierId }) => levierId,
      ({ categorie }) => categorie ?? '',
    ]);
  };

  const toQualifiedCategories = (): PertinenceLevier[] =>
    categorieActionEnumValues.toSorted().map((categorie) => ({
      levierId: 'biogaz',
      categorie,
      pertinence: 'a_discuter',
    }));

  it("garde la pertinence des catégories quand l'écriture du levier non pertinent échoue", async () => {
    const { collectiviteId, admin } = await addCollectiviteWithAdmin();
    await service.upsertPertinence(
      {
        collectiviteId,
        enjeu: 'ges',
        levierId: 'biogaz',
        pertinence: 'pertinent',
      },
      { user: admin }
    );
    await Promise.all(
      categorieActionEnumValues.map((categorie) =>
        service.upsertPertinence(
          {
            collectiviteId,
            enjeu: 'ges',
            levierId: 'biogaz',
            categorie,
            pertinence: 'a_discuter',
          },
          { user: admin }
        )
      )
    );

    const upsertResult = await serviceWithFailingUpsert.upsertPertinence(
      {
        collectiviteId,
        enjeu: 'ges',
        levierId: 'biogaz',
        pertinence: 'non_pertinent',
      },
      { user: admin }
    );

    expect({
      upsertResult,
      storedPertinences: await listSortedPertinences(collectiviteId),
    }).toStrictEqual({
      upsertResult: {
        success: false,
        error: PertinenceLeviersRepositoryErrorEnum.UPSERT_PERTINENCE_ERROR,
        cause: undefined,
      },
      storedPertinences: [
        { levierId: 'biogaz', pertinence: 'pertinent' },
        ...toQualifiedCategories(),
      ],
    });
  });
});
