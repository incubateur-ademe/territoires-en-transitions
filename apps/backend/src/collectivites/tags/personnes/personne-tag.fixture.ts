import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { PersonneTagCreate } from '@tet/domain/collectivites';
import { eq } from 'drizzle-orm';
import { personneTagTable } from './personne-tag.table';

export type PersonneTagAllowedInput = Partial<PersonneTagCreate> &
  Pick<PersonneTagCreate, 'collectiviteId'>;

export async function createPersonneTag({
  database,
  tagData,
}: {
  database: DatabaseServiceInterface;
  tagData: PersonneTagAllowedInput;
}) {
  const personne = await database.db
    .insert(personneTagTable)
    .values({ ...tagData, nom: tagData.nom ?? 'fixture nom' })
    .returning()
    .then(([tag]) => tag);

  const cleanup = async () => {
    await database.db
      .delete(personneTagTable)
      .where(eq(personneTagTable.id, personne.id));
  };

  return { ...personne, cleanup };
}

export async function cleanupByCollectiviteId(
  database: DatabaseServiceInterface,
  collectiviteId: number
): Promise<void> {
  const ret = await database.db
    .delete(personneTagTable)
    .where(eq(personneTagTable.collectiviteId, collectiviteId))
    .returning();
  console.log(
    `${ret.length} personne tags removed from collectivite ${collectiviteId}`
  );
}
