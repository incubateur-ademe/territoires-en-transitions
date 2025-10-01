import { ficheActionTable, FicheCreate } from '@/domain/plans/fiches';
import { databaseService } from 'e2e/tests/fixtures/database.service';

export async function createFiches(fiches: FicheCreate[]) {
  return await databaseService.db
    .insert(ficheActionTable)
    .values(fiches)
    .returning();
}
