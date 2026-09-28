import { saveBlob } from '@/app/utils/save-blob';

export type SignedDownload = {
  url: string;
  filename: string;
};

export const fetchAndSaveDocument = async ({
  url,
  filename,
}: SignedDownload): Promise<void> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  await saveBlob(await response.blob(), filename);
};
