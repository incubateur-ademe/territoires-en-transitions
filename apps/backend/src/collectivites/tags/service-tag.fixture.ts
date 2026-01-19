import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { ServiceTagCreate } from '@tet/domain/collectivites';
import { eq } from 'drizzle-orm';
import { serviceTagTable } from './service-tag.table';

type ServiceTagAllowedInput = Partial<ServiceTagCreate> &
  Pick<ServiceTagCreate, 'collectiviteId'>;

export async function createServiceTag({
  database,
  tagData,
}: {
  database: DatabaseServiceInterface;
  tagData: ServiceTagAllowedInput;
}) {
  const service = await database.db
    .insert(serviceTagTable)
    .values({ ...tagData, nom: tagData.nom ?? 'fixture service nom' })
    .returning()
    .then(([tag]) => tag);

  const cleanup = async () => {
    await database.db
      .delete(serviceTagTable)
      .where(eq(serviceTagTable.id, service.id));
  };

  return { ...service, cleanup };
}

export async function cleanupByCollectiviteId(
  database: DatabaseServiceInterface,
  collectiviteId: number
): Promise<void> {
  const ret = await database.db
    .delete(serviceTagTable)
    .where(eq(serviceTagTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${ret.length} categorie tags removed from collectivite ${collectiviteId}`
  );
}
