import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { eq } from 'drizzle-orm';
import { groupementCollectiviteTable } from './groupement-collectivite.table';
import { CreateGroupementType, groupementTable } from './groupement.table';

type GroupementAllowedInput = Partial<CreateGroupementType> & {
  collectiviteIds?: number[];
};

export async function createGroupement({
  database,
  groupementData,
}: {
  database: DatabaseService;
  groupementData: GroupementAllowedInput;
}) {
  const groupement = await database.db
    .insert(groupementTable)
    .values({
      nom: groupementData.nom ?? 'fixture groupement nom',
    })
    .returning()
    .then(([g]) => g);

  // Associate collectivites with the groupement if provided
  if (groupementData.collectiviteIds?.length) {
    await database.db.insert(groupementCollectiviteTable).values(
      groupementData.collectiviteIds.map((collectiviteId) => ({
        groupementId: groupement.id,
        collectiviteId,
      }))
    );
  }

  const cleanup = async () => {
    // Delete groupement (cascade will delete groupement_collectivite associations)
    await database.db
      .delete(groupementTable)
      .where(eq(groupementTable.id, groupement.id));
  };

  return { ...groupement, cleanup };
}

export async function addCollectiviteToGroupement({
  database,
  groupementId,
  collectiviteId,
}: {
  database: DatabaseService;
  groupementId: number;
  collectiviteId: number;
}) {
  await database.db.insert(groupementCollectiviteTable).values({
    groupementId,
    collectiviteId,
  });
}
