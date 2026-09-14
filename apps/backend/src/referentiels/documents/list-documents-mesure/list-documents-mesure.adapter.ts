import { FileInfo } from '@tet/backend/collectivites/documents/file-info.utils';
import { Lien } from '@tet/domain/collectivites';
import { groupBy } from 'es-toolkit';

type DocumentRow = {
  id: number | null;
  fichierId: number | null;
  fichier: FileInfo | null;
  lien: Lien | null;
  bibliothequeFilename: string | null;
};

type AttenduRow = DocumentRow & {
  action: { actionId: string };
  preuveReglementaire: { id: string };
};

type DocumentAssemble<Row extends DocumentRow> = Omit<
  Row,
  'id' | 'fichierId' | 'fichier' | 'lien' | 'bibliothequeFilename'
> & { id: number } & (
    | { type: 'fichier'; fichier: FileInfo }
    | { type: 'lien'; lien: Lien }
    | { type: 'fichierManquant'; filename: string }
  );

export function toDocuments<Row extends DocumentRow>(
  rows: Row[]
): DocumentAssemble<Row>[] {
  return rows.flatMap((row): DocumentAssemble<Row>[] => {
    const { id, fichierId, fichier, lien, bibliothequeFilename, ...reste } =
      row;
    if (id === null) {
      return [];
    }
    if (fichierId === null) {
      return lien ? [{ ...reste, id, type: 'lien' as const, lien }] : [];
    }
    if (fichier) {
      return [{ ...reste, id, type: 'fichier' as const, fichier }];
    }
    if (bibliothequeFilename) {
      return [
        {
          ...reste,
          id,
          type: 'fichierManquant' as const,
          filename: bibliothequeFilename,
        },
      ];
    }
    return [];
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
