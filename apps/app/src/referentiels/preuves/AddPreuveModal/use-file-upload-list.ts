import { useState } from 'react';
import { FileConstraints, keepWithinMaxFiles } from '../upload/constants';
import { FileUploadItem } from './FileItem';
import { filesToUploadList } from './filesToUploadList';
import { UploadStatus, UploadStatusCode } from './types';

const getFileByName = (
  fileName: string,
  selection: Array<FileUploadItem>
): number => selection.findIndex(({ file }) => file.name === fileName);

type UseFileUploadListInput = {
  collectiviteId: number | undefined;
  initialItems?: Array<FileUploadItem>;
  onUploadSuccess?: (fichierId: number, fileName: string) => void;
  /** Contraintes de format/taille du contexte de dépôt. */
  constraints?: FileConstraints;
};

type UseFileUploadListResult = {
  items: Array<FileUploadItem>;
  onDropFiles: (files: FileList | null) => Promise<void>;
  onStatusChange: (fileName: string, status: UploadStatus) => void;
  onDismissItem: (fileName: string) => void;
};

export const useFileUploadList = ({
  collectiviteId,
  initialItems,
  onUploadSuccess,
  constraints,
}: UseFileUploadListInput): UseFileUploadListResult => {
  const [items, setItems] = useState<Array<FileUploadItem>>(initialItems ?? []);

  const onDropFiles = async (files: FileList | null): Promise<void> => {
    if (!files || !collectiviteId) return;
    const filesToUpload = await filesToUploadList(
      collectiviteId,
      files,
      constraints
    );
    // Le glisser-déposer n'est pas bridé par l'attribut `multiple` : on borne la
    // liste cumulée, en gardant les derniers déposés (ceux qui remplacent).
    setItems((prev) =>
      keepWithinMaxFiles([...prev, ...filesToUpload], constraints?.maxFiles)
    );
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
