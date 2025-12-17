import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { CategorieTagCreate } from '@tet/domain/collectivites';
import { eq } from 'drizzle-orm';
import { categorieTagTable } from './categorie-tag.table';

type CategorieTagAllowedInput = Partial<CategorieTagCreate> &
  Pick<CategorieTagCreate, 'collectiviteId'>;

export async function createCategorieTag({
  database,
  tagData,
}: {
  database: DatabaseServiceInterface;
  tagData: CategorieTagAllowedInput;
}) {
  const categorie = await database.db
    .insert(categorieTagTable)
    .values({
      ...tagData,
      nom: tagData.nom ?? 'fixture categorie nom',
    })
    .returning()
    .then(([tag]) => tag);

  const cleanup = async () => {
    await database.db
      .delete(categorieTagTable)
      .where(eq(categorieTagTable.id, categorie.id));
  };

  return { data: categorie, cleanup };
}

export async function cleanupByCollectiviteId(
  database: DatabaseServiceInterface,
  collectiviteId: number
): Promise<void> {
  const ret = await database.db
    .delete(categorieTagTable)
    .where(eq(categorieTagTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${ret.length} categorie tags removed from collectivite ${collectiviteId}`
  );
}
