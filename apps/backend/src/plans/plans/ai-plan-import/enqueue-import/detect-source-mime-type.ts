const PDF_MIME = 'application/pdf';
const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const CSV_MIME = 'text/csv';

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46];
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04];

const TEXT_SNIFF_LENGTH = 8192;

const declaredAsText = (declaredMimeType: string): boolean =>
  declaredMimeType === 'text/csv' ||
  declaredMimeType === 'application/csv' ||
  declaredMimeType === 'text/plain';

export const detectSourceMimeType = (
  buffer: Buffer,
  declaredMimeType: string
): string | null => {
  if (startsWith(buffer, PDF_SIGNATURE)) {
    return PDF_MIME;
  }
  if (startsWith(buffer, ZIP_SIGNATURE)) {
    return XLSX_MIME;
  }
  if (declaredAsText(declaredMimeType) && looksLikeText(buffer)) {
    return CSV_MIME;
  }
  return null;
};

const startsWith = (buffer: Buffer, signature: number[]): boolean =>
  buffer.length >= signature.length &&
  signature.every((byte, index) => buffer[index] === byte);

const looksLikeText = (buffer: Buffer): boolean => {
  const sample = buffer.subarray(0, TEXT_SNIFF_LENGTH);
  return !sample.includes(0);
};
