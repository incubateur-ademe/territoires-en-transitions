import { DocumentHash } from '@tet/domain/collectivites';
import { useState } from 'react';
import { FileConstraints, keepWithinMaxFiles } from '../upload/constants';
import { useUploadFile } from '@/app/collectivites/documents/upload/use-upload-file';
import { FileUploadItem } from './FileItem';
import { filesToUploadList, PreparedFile } from './filesToUploadList';
import {
  isUploadInFlight,
  UploadErrorCode,
  UploadStatus,
  UploadStatusCode,
} from './types';
import { uploadFileResultToStatus } from './upload-file-result-to-status';

type UseFileUploadListInput = {
  collectiviteId: number;
  initialItems?: Array<FileUploadItem>;
  constraints?: FileConstraints;
};

type UseFileUploadListResult = {
  items: Array<FileUploadItem>;
  onDropFiles: (files: ArrayLike<File> | null) => Promise<void>;
  onDismissItem: (itemId: string) => void;
};

type ListedFile =
  | { kind: 'settled'; item: FileUploadItem }
  | {
      kind: 'toUpload';
      item: FileUploadItem;
      hash: DocumentHash;
      controller: AbortController;
    };

type FileToUpload = Extract<ListedFile, { kind: 'toUpload' }>;

const isToUpload = (listed: ListedFile): listed is FileToUpload =>
  listed.kind === 'toUpload';

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';

const abortWhenInFlight = ({ status }: FileUploadItem): void => {
  if (isUploadInFlight(status)) {
    status.abort();
  }
};

const toEvictedItems = (
  current: Array<FileUploadItem>,
  addedCount: number,
  maxFiles: number | undefined
): Array<FileUploadItem> => {
  if (maxFiles === undefined) {
    return [];
  }
  const overflow = current.length + addedCount - maxFiles;
  return overflow > 0 ? current.slice(0, overflow) : [];
};

const toListedFile = (prepared: PreparedFile): ListedFile => {
  const id = crypto.randomUUID();
  if (prepared.kind === 'rejected') {
    return {
      kind: 'settled',
      item: { id, file: prepared.file, status: prepared.status },
    };
  }

  const { file, hash } = prepared;
  const controller = new AbortController();
  return {
    kind: 'toUpload',
    hash,
    controller,
    item: {
      id,
      file,
      status: {
        code: UploadStatusCode.preparing,
        hash,
        abort: () => controller.abort(),
      },
    },
  };
};

export const useFileUploadList = ({
  collectiviteId,
  initialItems,
  constraints,
}: UseFileUploadListInput): UseFileUploadListResult => {
  const [items, setItems] = useState<Array<FileUploadItem>>(initialItems ?? []);
  const uploadFile = useUploadFile();

  const setStatus = (itemId: string, status: UploadStatus): void =>
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status } : item))
    );

  const removeItem = (itemId: string): void =>
    setItems((prev) => prev.filter((item) => item.id !== itemId));

  const runUpload = async ({
    item,
    hash,
    controller,
  }: FileToUpload): Promise<void> => {
    const abort = (): void => controller.abort();

    try {
      const uploadResult = await uploadFile({
        collectiviteId,
        file: item.file,
        hash,
        signal: controller.signal,
        onProgress: (progress) =>
          setStatus(item.id, {
            code: UploadStatusCode.running,
            hash,
            progress,
            abort,
          }),
      });
      if (controller.signal.aborted) {
        removeItem(item.id);
        return;
      }
      setStatus(item.id, uploadFileResultToStatus(uploadResult, hash));
    } catch (error) {
      if (isAbortError(error)) {
        removeItem(item.id);
        return;
      }
      setStatus(item.id, {
        code: UploadStatusCode.failed,
        error: UploadErrorCode.uploadError,
      });
    }
  };

  const onDropFiles = async (files: ArrayLike<File> | null): Promise<void> => {
    if (!files) return;
    const listedFiles = (await filesToUploadList(files, constraints)).map(
      toListedFile
    );

    // Le glisser-déposer n'est pas bridé par l'attribut `multiple` : on borne la
    // liste cumulée, en gardant les derniers déposés (ceux qui remplacent).
    toEvictedItems(items, listedFiles.length, constraints?.maxFiles).forEach(
      abortWhenInFlight
    );
    setItems((prev) =>
      keepWithinMaxFiles(
        [...prev, ...listedFiles.map(({ item }) => item)],
        constraints?.maxFiles
      )
    );

    await Promise.all(listedFiles.filter(isToUpload).map(runUpload));
  };

  return { items, onDropFiles, onDismissItem: removeItem };
};
