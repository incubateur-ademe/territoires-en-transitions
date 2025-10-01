import {
  Fiche,
  ficheActionTable,
} from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';

export function createFiche({
  collectiviteId,
  db,
}: {
  collectiviteId: number;
  db: DatabaseService;
}) {
  const fiche = db.db
    .insert(ficheActionTable)
    .values({
      collectiviteId,
    })
    .returning()
    .then((rows) => rows[0]);

  onTestFinished(() => {
    db.db
      .delete(ficheActionTable)
      .where(eq(ficheActionTable.id, (fiche as unknown as Fiche)['id']))
      .returning();
  });
  return fiche;
}
