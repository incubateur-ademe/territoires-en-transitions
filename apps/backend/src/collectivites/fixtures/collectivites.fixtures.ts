import {
  Collectivite,
  collectiviteBucketTable,
  collectiviteTable,
  CollectiviteType,
  collectiviteTypeEnum,
} from '@/domain/collectivites';
import { addTestUser, TestUserArgs } from '@/domain/users';
import { DatabaseServiceDto } from '@/domain/utils';
import { eq } from 'drizzle-orm';

export type TestCollectiviteArgs = {
  nom?: string;
  type?: CollectiviteType;
};

// ajoute une collectivité
export async function addTestCollectivite(
  databaseService: DatabaseServiceDto,
  { nom, type }: TestCollectiviteArgs
) {
  const result = (await databaseService.db
    .insert(collectiviteTable)
    .values([
      {
        nom: nom || `Collectivité ${Math.random().toString().substring(2, 6)}`,
        type: type || collectiviteTypeEnum.EPCI,
      },
    ])
    .returning()
    .then(([c]) => c)) as Collectivite;

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
}

// ajoute une collectivité et un utilisateur rattaché à celle-ci
export async function addTestCollectiviteAndUser(
  databaseService: DatabaseServiceDto,
  args?: Omit<TestUserArgs, 'collectiviteId'> & TestCollectiviteArgs
) {
  const { nom, type, ...userArgs } = args || {};
  const { collectivite, cleanup: collectiviteCleanup } =
    await addTestCollectivite(databaseService, {
      nom,
      type,
    });
  const { user, cleanup: userCleanup } = await addTestUser(databaseService, {
    ...userArgs,
    collectiviteId: collectivite.id,
  });
  const cleanup = async () => {
    await userCleanup();
    await collectiviteCleanup();
  };
  return { collectivite, user, cleanup };
}
