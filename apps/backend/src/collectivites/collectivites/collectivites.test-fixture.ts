import { CollectiviteNatureType } from '@tet/backend/collectivites/shared/models/collectivite-banatic-type.table';
import { collectiviteBucketTable } from '@tet/backend/collectivites/shared/models/collectivite-bucket.table';
import { cotTable } from '@tet/backend/referentiels/labellisations/cot.table';
import {
  addTestUser,
  TestUserArgs,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import {
  Collectivite,
  CollectiviteType,
  collectiviteTypeEnum,
  CreateCollectivite,
} from '@tet/domain/collectivites';
import { Dcp } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { eq } from 'drizzle-orm';
import { bibliothequeFichierTable } from '../documents/models/bibliotheque-fichier.table';
import { collectiviteTable } from '../shared/models/collectivite.table';

export async function setCollectiviteAsCOT(
  databaseService: DatabaseServiceInterface,
  collectiviteId: number,
  isCOT: boolean
): Promise<void> {
  if (isCOT) {
    await databaseService.db.insert(cotTable).values({
      collectiviteId: collectiviteId,
      actif: true,
      signataire: collectiviteId,
    });
  } else {
    await databaseService.db
      .delete(cotTable)
      .where(eq(cotTable.collectiviteId, collectiviteId));
  }
}

// ajoute une collectivité
export async function addTestCollectivite(
  databaseService: DatabaseServiceInterface,
  collectiviteArgs: Partial<Collectivite> & { isCOT?: boolean } = {}
): Promise<{ collectivite: Collectivite; cleanup: () => Promise<void> }> {
  const { isCOT, ...collectiviteInput } = collectiviteArgs;
  const createCollectivite: CreateCollectivite = {
    ...collectiviteInput,
    nom:
      collectiviteArgs.nom ||
      `Collectivité ${Math.random().toString().substring(2, 6)}`,
    type: collectiviteArgs.type || collectiviteTypeEnum.EPCI,
  };

  try {
    const result = await databaseService.db
      .insert(collectiviteTable)
      .values([createCollectivite])
      .returning()
      .then(([c]) => ({
        ...c,
        natureInsee: c.natureInsee as CollectiviteNatureType | null,
        type: c.type as CollectiviteType,
      }));

    if (collectiviteArgs.isCOT) {
      await setCollectiviteAsCOT(databaseService, result.id, true);
    }

    console.log(`Added collectivite ${result.nom} with id ${result.id}`);
    const collectiviteId = result?.id;

    const cleanup = async () => {
      if (collectiviteId) {
        console.log(`Cleanup collectivite ${collectiviteId}`);
        await databaseService.db
          .delete(bibliothequeFichierTable)
          .where(eq(bibliothequeFichierTable.collectiviteId, collectiviteId));
        await databaseService.db
          .delete(collectiviteBucketTable)
          .where(eq(collectiviteBucketTable.collectiviteId, collectiviteId));
        await databaseService.db
          .delete(cotTable)
          .where(eq(cotTable.collectiviteId, collectiviteId));
        await databaseService.db
          .delete(collectiviteTable)
          .where(eq(collectiviteTable.id, collectiviteId));
      }
    };
    return { collectivite: result, cleanup };
  } catch (err) {
    throw new Error(
      `Error adding collectivite on database ${
        process.env.SUPABASE_DATABASE_URL
      }: ${getErrorMessage(err)}`
    );
  }
}

// ajoute une collectivité et un utilisateur rattaché à celle-ci
export async function addTestCollectiviteAndUser(
  databaseService: DatabaseServiceInterface,
  args?: {
    user: Omit<TestUserArgs, 'collectiviteId'>;
    collectivite?: Partial<Collectivite>;
  }
): Promise<{
  collectivite: Collectivite;
  user: Dcp & { password: string };
  cleanup: () => Promise<void>;
}> {
  const { collectivite, cleanup: collectiviteCleanup } =
    await addTestCollectivite(databaseService, args?.collectivite);
  const { user, cleanup: userCleanup } = await addTestUser(databaseService, {
    ...(args?.user ?? {}),
    collectiviteId: collectivite.id,
  });
  const cleanup = async () => {
    await userCleanup();
    await collectiviteCleanup();
  };
  return { collectivite, user, cleanup };
}

export async function addTestCollectiviteAndUsers(
  databaseService: DatabaseServiceInterface,
  args: {
    users: Omit<TestUserArgs, 'collectiviteId'>[];
    collectivite?: Partial<Collectivite> & { isCOT?: boolean };
  }
): Promise<{
  collectivite: Collectivite;
  users: (Dcp & { password: string })[];
  cleanup: () => Promise<void>;
}> {
  const { collectivite, cleanup: collectiviteCleanup } =
    await addTestCollectivite(databaseService, args?.collectivite);
  const usersResults = await Promise.all(
    args?.users.map(async (user) => {
      return await addTestUser(databaseService, {
        ...user,
        collectiviteId: collectivite.id,
      });
    })
  );

  const usersCleanup = async () => {
    await Promise.all(
      usersResults.map(async (userResult) => {
        await userResult.cleanup();
      })
    );
  };

  const users = usersResults.map((userResult) => userResult.user);

  const cleanup = async () => {
    await usersCleanup();
    await collectiviteCleanup();
  };
  return { collectivite, users, cleanup };
}
