import { CollectiviteNatureType } from '@/backend/collectivites/shared/models/collectivite-banatic-type.table';
import { collectiviteBucketTable } from '@/backend/collectivites/shared/models/collectivite-bucket.table';
import { addTestUser, TestUserArgs } from '@/backend/users/users/users.fixture';
import { DatabaseServiceInterface } from '@/backend/utils/database/database-service.interface';
import {
  Collectivite,
  CollectiviteType,
  collectiviteTypeEnum,
  CreateCollectivite,
} from '@/domain/collectivites';
import { Dcp } from '@/domain/users';
import { getErrorMessage } from '@/domain/utils';
import { eq } from 'drizzle-orm';
import { collectiviteTable } from '../shared/models/collectivite.table';

// ajoute une collectivité
export async function addTestCollectivite(
  databaseService: DatabaseServiceInterface,
  collectiviteArgs: Partial<Collectivite> = {}
): Promise<{ collectivite: Collectivite; cleanup: () => Promise<void> }> {
  const createCollectivite: CreateCollectivite = {
    ...collectiviteArgs,
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

    console.log(`Added collectivite ${result.nom} with id ${result.id}`);
    const collectiviteId = result?.id;

    const cleanup = async () => {
      if (collectiviteId) {
        console.log(`Cleanup collectivite ${collectiviteId}`);
        await databaseService.db
          .delete(collectiviteBucketTable)
          .where(eq(collectiviteBucketTable.collectiviteId, collectiviteId));
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
