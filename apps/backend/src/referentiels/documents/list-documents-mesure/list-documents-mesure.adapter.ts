import {
  DocumentRow,
  toDocuments,
} from '@tet/backend/collectivites/documents/to-documents.adapter';
import { groupBy } from 'es-toolkit';

type AttenduRow = DocumentRow & {
  action: { actionId: string };
  preuveReglementaire: { id: string };
};

export function toAttendus<Row extends AttenduRow>(rows: Row[]) {
  return Object.values(
    groupBy(
      rows,
      ({ action, preuveReglementaire }) =>
        `${action.actionId}/${preuveReglementaire.id}`
    )
  ).map((depots) => ({
    preuveReglementaire: depots[0].preuveReglementaire,
    action: depots[0].action,
    documents: toDocuments(depots),
  }));
}
