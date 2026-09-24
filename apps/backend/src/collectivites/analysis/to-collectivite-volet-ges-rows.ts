import { LevierMobilisation } from './mobilisation.repository';
import { collectiviteVoletGesTable } from './models/collectivite-volet-ges.table';

export const toCollectiviteVoletGesRows = ({
  collectiviteId,
  leviers,
}: {
  collectiviteId: number;
  leviers: LevierMobilisation[];
}): (typeof collectiviteVoletGesTable.$inferInsert)[] =>
  leviers.flatMap(({ levierId, volets }) =>
    volets.map(({ categorie, note, ficheIds }) => ({
      collectiviteId,
      levierId,
      categorie,
      note,
      ficheIds,
    }))
  );
