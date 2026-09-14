import { DocumentSupport, Lien, StoredFile } from '@tet/domain/collectivites';
import { groupBy } from 'es-toolkit';

type DocumentRow = {
  id: number | null;
  fichierId: number | null;
  fichier: StoredFile | null;
  lien: Lien | null;
  bibliothequeFilename: string | null;
};

type AttenduRow = DocumentRow & {
  action: { actionId: string };
  preuveReglementaire: { id: string };
};

type AssembledDocument<Row extends DocumentRow> = Omit<
  Row,
  'id' | 'fichierId' | 'fichier' | 'lien' | 'bibliothequeFilename'
> & { id: number } & Exclude<DocumentSupport, { type: 'nonRenseigne' }>;

export function toDocuments<Row extends DocumentRow>(
  rows: Row[]
): AssembledDocument<Row>[] {
  return rows.flatMap((row): AssembledDocument<Row>[] => {
    const { id, fichierId, fichier, lien, bibliothequeFilename, ...rest } = row;
    if (id === null) {
      return [];
    }
    if (fichierId === null) {
      if (!lien) {
        return [];
      }
      return [{ ...rest, id, type: 'lien' as const, lien }];
    }
    if (fichier) {
      return [{ ...rest, id, type: 'fichier' as const, fichier }];
    }
    if (bibliothequeFilename) {
      return [
        {
          ...rest,
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
