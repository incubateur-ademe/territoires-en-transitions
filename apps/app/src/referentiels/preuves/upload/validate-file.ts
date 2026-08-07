import { getExtension } from '@/app/utils/file';
import { DEFAULT_FILE_CONSTRAINTS, FileConstraints } from './constants';

export type FileValidationError =
  | 'sizeError'
  | 'formatError'
  | 'formatAndSizeError';

/**
 * Contrôle taille et format d'un fichier. Point de vérité unique du contrôle
 * client : la modale d'ajout comme les uploads unitaires passent par ici.
 */
export const validateFile = (
  file: File,
  constraints: FileConstraints = DEFAULT_FILE_CONSTRAINTS
): FileValidationError | null => {
  const sizeErr = file.size > constraints.maxSizeBytes;
  const formatErr = !isValidFileFormat(file, constraints);
  if (sizeErr && formatErr) return 'formatAndSizeError';
  if (sizeErr) return 'sizeError';
  if (formatErr) return 'formatError';
  return null;
};

const isValidFileFormat = (
  file: File,
  { formats, mimeTypes }: FileConstraints
): boolean => {
  const ext = getExtension(file.name);
  if (!ext || !formats.includes(ext.toLowerCase())) {
    return false;
  }
  // Le type déclaré par le navigateur n'est vérifié que si le contexte l'exige :
  // il est parfois vide selon la plateforme.
  if (mimeTypes && file.type && !mimeTypes.includes(file.type.toLowerCase())) {
    return false;
  }
  return true;
};
