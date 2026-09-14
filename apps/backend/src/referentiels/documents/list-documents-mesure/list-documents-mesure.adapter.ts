import { FileInfo } from '@tet/backend/collectivites/documents/file-info.utils';
import { Lien } from '@tet/domain/collectivites';
import { groupBy } from 'es-toolkit';
import { DocumentSupportInput } from './list-documents-mesure.output';

type SupportRow = {
  id: number | null;
  fichierId: number | null;
  fichier: FileInfo | null;
  lien: Lien | null;
  bibliothequeFilename: string | null;
};

type AttenduRow = SupportRow & {
  action: { actionId: string };
  preuveReglementaire: { id: string };
};

function toSupport({
  fichierId,
  fichier,
  lien,
  bibliothequeFilename,
}: SupportRow): DocumentSupportInput | undefined {
  if (fichierId === null) {
    return lien ? { type: 'lien', lien } : undefined;
  }
  if (fichier) {
    return { type: 'fichier', fichier };
  }
  if (bibliothequeFilename) {
    return { type: 'fichierManquant', filename: bibliothequeFilename };
  }
  return undefined;
}

export function toDocuments<Row extends SupportRow>(
  rows: Row[]
): (Omit<Row, 'id'> & { id: number; support: DocumentSupportInput })[] {
  return rows.flatMap((row) => {
    const { id } = row;
    if (id === null) {
      return [];
    }
    const support = toSupport(row);
    return support ? [{ ...row, id, support }] : [];
  });
}

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
