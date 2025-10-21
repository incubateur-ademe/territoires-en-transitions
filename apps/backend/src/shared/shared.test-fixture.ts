import { DatabaseService } from '../utils/database/database.service';
import {
  Thematique,
  ThematiqueInsert,
  thematiqueTable,
} from './thematiques/thematique.table';

export async function createThematique({
  database,
  thematiqueData,
}: {
  database: DatabaseService;
  thematiqueData: ThematiqueInsert;
}): Promise<Thematique> {
  return database.db
    .insert(thematiqueTable)
    .values(thematiqueData)
    .returning()
    .then(([thematique]) => thematique);
}
