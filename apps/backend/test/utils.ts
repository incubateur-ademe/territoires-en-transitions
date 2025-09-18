import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { eq } from 'drizzle-orm';

export function createFiche({
  collectiviteId,
  db,
}: {
  collectiviteId: number;
  db: DatabaseService;
}) {
  return db.db
    .insert(ficheActionTable)
    .values({
      collectiviteId,
    })
    .returning()
    .then((rows) => rows[0]);
}

export function deleteFiche({
  ficheId,
  db,
}: {
  ficheId: number;
  db: DatabaseService;
}) {
  return db.db
    .delete(ficheActionTable)
    .where(eq(ficheActionTable.id, ficheId))
    .returning();
}
