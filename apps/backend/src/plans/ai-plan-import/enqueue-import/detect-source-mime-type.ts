const PDF_MIME = 'application/pdf';
export const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const CSV_MIME = 'text/csv';

export type SourceMimeType =
  | typeof PDF_MIME
  | typeof XLSX_MIME
  | typeof CSV_MIME;

// '%PDF'
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46];

// 'PK\x03\x04' : un .xlsx est une archive ZIP (Office Open XML),
// il n'existe pas de magic number propre à Excel.
const XLSX_ZIP_CONTAINER_MAGIC_BYTES = [0x50, 0x4b, 0x03, 0x04];

// Fenêtre conventionnelle du sniff texte/binaire (même ordre de grandeur
// que git et file(1)) : les formats binaires contiennent quasi toujours
// des octets nuls dès leurs premiers blocs.
const PLAIN_TEXT_SNIFF_BYTES = 8192;

// Le MIME déclaré vient du client et dépend de l'OS/navigateur :
// un CSV arrive souvent en text/plain, voire application/csv.
const CSV_DECLARED_MIME_TYPES = ['text/csv', 'application/csv', 'text/plain'];

export const detectSourceMimeType = (
  buffer: Buffer,
  declaredMimeType: string
): SourceMimeType | null => {
  if (looksLikePdf(buffer)) {
    return PDF_MIME;
  }
  if (looksLikeXlsx(buffer)) {
    return XLSX_MIME;
  }
  if (looksLikeCsv(buffer, declaredMimeType)) {
    return CSV_MIME;
  }
  return null;
};

const looksLikePdf = (buffer: Buffer): boolean =>
  startsWithBytes(buffer, PDF_MAGIC_BYTES);

// Heuristique volontairement large : n'importe quel ZIP (docx, archive
// quelconque) passe ce test. La validation profonde (présence d'un
// workbook, taille décompressée) est faite par validateXlsxArchive
// côté service.
const looksLikeXlsx = (buffer: Buffer): boolean =>
  startsWithBytes(buffer, XLSX_ZIP_CONTAINER_MAGIC_BYTES);

// Le CSV n'a pas de signature binaire : on croise le MIME déclaré
// (compatible texte) avec l'absence d'octets nuls dans l'échantillon,
// pour rejeter un binaire renommé en .csv.
const looksLikeCsv = (buffer: Buffer, declaredMimeType: string): boolean =>
  CSV_DECLARED_MIME_TYPES.includes(declaredMimeType) &&
  isPlainText(buffer.subarray(0, PLAIN_TEXT_SNIFF_BYTES));

const startsWithBytes = (buffer: Buffer, magicBytes: number[]): boolean =>
  buffer.length >= magicBytes.length &&
  magicBytes.every((byte, index) => buffer[index] === byte);

const NULL_BYTE = 0;

// Un fichier texte (UTF-8, latin-1…) ne contient jamais d'octet nul.
const isPlainText = (sample: Buffer): boolean => !sample.includes(NULL_BYTE);
