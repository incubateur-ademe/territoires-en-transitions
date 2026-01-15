import { PersonneId } from '@tet/domain/collectivites';
import { FicheImport } from './schemas/fiche-import.schema';
export type PlanImport = {
  nom: string;
  id?: number;
  fiches: FicheImport[];
  typeId?: number;
  pilotes?: PersonneId[];
  referents?: PersonneId[];
};
