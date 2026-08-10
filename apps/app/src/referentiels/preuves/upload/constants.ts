import {
  PCAET_DOCUMENT_ACCEPTED_EXTENSIONS,
  PCAET_DOCUMENT_ACCEPTED_MIME_TYPES,
} from '@tet/domain/demarches';

// poids max en Mo et en octets pour un fichier
export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

// formats attendus
export const EXPECTED_FORMATS = [
  'pdf',
  'doc',
  'docx',
  'odt',
  'ods',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'jpeg',
  'jpg',
  'png',
];

// liste des extensions acceptées sous forme de chaîne
export const EXPECTED_FORMATS_LIST = EXPECTED_FORMATS.map(
  ext => `.${ext}`
).join(',');

/**
 * Contraintes de fichier d'un contexte de dépôt. Les composants d'upload les
 * reçoivent en option : sans rien préciser on garde les formats acceptés
 * partout ailleurs dans le produit.
 */
export type FileConstraints = {
  /** extensions acceptées, sans le point */
  formats: readonly string[];
  maxSizeBytes: number;
  /** vérifié en plus de l'extension lorsque renseigné */
  mimeTypes?: readonly string[];
  /** 1 désactive la sélection multiple */
  maxFiles?: number;
};

export const DEFAULT_FILE_CONSTRAINTS: FileConstraints = {
  formats: EXPECTED_FORMATS,
  maxSizeBytes: MAX_FILE_SIZE_BYTES,
};

/** Dossier réglementaire d'une démarche PCAET : un seul PDF par pièce attendue. */
export const PDF_ONLY_FILE_CONSTRAINTS: FileConstraints = {
  formats: PCAET_DOCUMENT_ACCEPTED_EXTENSIONS,
  maxSizeBytes: MAX_FILE_SIZE_BYTES,
  mimeTypes: PCAET_DOCUMENT_ACCEPTED_MIME_TYPES,
  maxFiles: 1,
};

/** Valeur de l'attribut `accept` d'un `<input type="file">`. */
export const toAcceptAttribute = ({ formats }: FileConstraints): string =>
  formats.map((ext) => `.${ext}`).join(',');

/**
 * Ne garde que les derniers éléments qu'accepte le contexte de dépôt (ce sont
 * ceux qui remplacent les précédents). Sans limite, la sélection passe telle
 * quelle. Le cas nul est traité à part : `slice(-0)` renverrait tout.
 */
export const keepWithinMaxFiles = <T>(
  items: T[],
  maxFiles: number | undefined
): T[] => {
  if (maxFiles === undefined) {
    return items;
  }
  return maxFiles > 0 ? items.slice(-maxFiles) : [];
};
