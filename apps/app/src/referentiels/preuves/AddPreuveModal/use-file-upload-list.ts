import { useState } from 'react';
import { TFileItem } from './FileItem';
import { filesToUploadList } from './filesToUploadList';
import { UploadStatus, UploadStatusCode } from './types';

const getFileByName = (
  fileName: string,
  selection: Array<TFileItem>
): number => selection.findIndex(({ file }) => file.name === fileName);

type UseFileUploadListInput = {
  collectiviteId: number | undefined;
  initialItems?: Array<TFileItem>;
  onUploadSuccess?: (fichierId: number, fileName: string) => void;
};

type UseFileUploadListResult = {
  items: Array<TFileItem>;
  onDropFiles: (files: FileList | null) => Promise<void>;
  onStatusChange: (fileName: string, status: UploadStatus) => void;
  onDismissItem: (fileName: string) => void;
};

export const useFileUploadList = ({
  collectiviteId,
  initialItems,
  onUploadSuccess,
}: UseFileUploadListInput): UseFileUploadListResult => {
  const [items, setItems] = useState<Array<TFileItem>>(initialItems ?? []);

  const onDropFiles = async (files: FileList | null): Promise<void> => {
    if (!files || !collectiviteId) return;
    const filesToUpload = await filesToUploadList(collectiviteId, files);
    setItems((prev) => [...prev, ...filesToUpload]);
  };

  const onStatusChange = (fileName: string, status: UploadStatus): void => {
    setItems((prev) => {
      const index = getFileByName(fileName, prev);
      if (index === -1) return prev;
      const next = [...prev];
      next[index] = { ...next[index], status };
      return next;
    });

    if (status.code === UploadStatusCode.completed) {
      onUploadSuccess?.(status.fichier_id, fileName);
    }
  };

  const onDismissItem = (fileName: string): void => {
    setItems((prev) => {
      const index = getFileByName(fileName, prev);
      if (index === -1) return prev;
      return [...prev.slice(0, index), ...prev.slice(index + 1)];
    });
  };

  return { items, onDropFiles, onStatusChange, onDismissItem };
};
