import { getExtension } from '@/app/utils/file';
import { EXPECTED_FORMATS, MAX_FILE_SIZE_BYTES } from './constants';

export type FileValidationError = 'sizeError' | 'formatError' | 'formatAndSizeError';

export const validateFile = (file: File): FileValidationError | null => {
  const sizeErr = file.size > MAX_FILE_SIZE_BYTES;
  const ext = getExtension(file.name);
  const formatErr = !ext || !EXPECTED_FORMATS.includes(ext.toLowerCase());
  if (sizeErr && formatErr) return 'formatAndSizeError';
  if (sizeErr) return 'sizeError';
  if (formatErr) return 'formatError';
  return null;
};
