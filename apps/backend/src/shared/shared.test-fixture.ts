import { Thematique, ThematiqueCreate } from '@/domain/shared';
import { DatabaseService } from '../utils/database/database.service';
import { thematiqueTable } from './thematiques/thematique.table';

export async function createThematique({
  database,
  thematiqueData,
}: {
  database: DatabaseService;
  thematiqueData: ThematiqueCreate;
}): Promise<Thematique> {
  return database.db
    .insert(thematiqueTable)
    .values(thematiqueData)
    .returning()
    .then(([thematique]) => thematique);
}
