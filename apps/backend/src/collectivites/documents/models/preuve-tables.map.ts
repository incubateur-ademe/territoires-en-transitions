import { PreuveType } from '@tet/domain/collectivites';
import { annexeTable } from './annexe.table';
import { preuveAuditTable } from './preuve-audit.table';
import { preuveComplementaireTable } from './preuve-complementaire.table';
import { preuveLabellisationTable } from './preuve-labellisation.table';
import { preuveRapportTable } from './preuve-rapport.table';
import { preuveReglementaireTable } from './preuve-reglementaire.table';

export type PreuveDocumentTable =
  | typeof annexeTable
  | typeof preuveComplementaireTable
  | typeof preuveReglementaireTable
  | typeof preuveLabellisationTable
  | typeof preuveAuditTable
  | typeof preuveRapportTable;

export const preuveTableByType: Record<PreuveType, PreuveDocumentTable> = {
  annexe: annexeTable,
  complementaire: preuveComplementaireTable,
  reglementaire: preuveReglementaireTable,
  labellisation: preuveLabellisationTable,
  audit: preuveAuditTable,
  rapport: preuveRapportTable,
};
