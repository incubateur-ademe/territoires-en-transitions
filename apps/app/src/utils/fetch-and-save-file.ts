import { saveBlob } from '@/app/utils/save-blob';

export type FileToSave = {
  url: string;
  filename: string;
};

export const fetchAndSaveFile = async ({
  url,
  filename,
}: FileToSave): Promise<void> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  await saveBlob(await response.blob(), filename);
};
