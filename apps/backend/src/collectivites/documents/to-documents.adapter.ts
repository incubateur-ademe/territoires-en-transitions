import {
  DocumentSupport,
  Lien,
  StoredFile,
  toFichier,
  toFichierManquant,
  toLien,
} from '@tet/domain/collectivites';

export type DocumentRow = {
  id: number | null;
  fichierId: number | null;
  fichier: StoredFile | null;
  lien: Lien | null;
  bibliothequeFilename: string | null;
};

type AssembledDocument<Row extends DocumentRow> = Omit<
  Row,
  'id' | 'fichierId' | 'fichier' | 'lien' | 'bibliothequeFilename'
> & { id: number } & Exclude<DocumentSupport, { type: 'nonRenseigne' }>;

const toDocument = <Row extends DocumentRow>(
  row: Row
): AssembledDocument<Row> | null => {
  const { id, fichierId, fichier, lien, bibliothequeFilename, ...rest } = row;
  if (id === null) {
    return null;
  }
  if (fichierId === null) {
    return lien ? toLien({ ...rest, id, lien }) : null;
  }
  if (fichier) {
    return toFichier({ ...rest, id, fichier });
  }
  if (bibliothequeFilename) {
    return toFichierManquant({ ...rest, id, filename: bibliothequeFilename });
  }
  return null;
};

export function toDocuments<Row extends DocumentRow>(
  rows: Row[]
): AssembledDocument<Row>[] {
  return rows.map(toDocument).filter((document) => document !== null);
}
