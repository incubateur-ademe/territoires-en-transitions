import { formatFileSize } from '@/app/utils/file';
import { Button } from '@/ui';
import { useEffect } from 'react';
import {
  UploadStatus,
  UploadStatusCode,
  UploadStatusFailed,
  UploadStatusRunning,
} from './types';
import { useUploader } from './useUploader';

export type TFileItem = {
  /** Fichier concerné */
  file: File;
  /** Etat */
  status: UploadStatus;
  /** Pour notifier de la sortie de l'état "running" */
  onRunningStopped?: (fileName: string, status: UploadStatus) => void;
  /** Pour supprimer un item de la liste "failed" */
  onRemoveFailed?: (fileName: string) => void;
};

export type TFileItemProps = TFileItem;

/**
 * Affiche un item représentant un fichier
 */
export const FileItem = (props: TFileItemProps) => {
  const { status } = props;
  const code: UploadStatusCode = status?.code || '';
  const Renderer = statusToRenderer[code];
  return Renderer ? <Renderer {...props} /> : null;
};

const FileItemRunning = (props: TFileItemProps) => {
  const { file, onRunningStopped } = props;
  const { status } = useUploader(file);
  const { progress, abort } = status as UploadStatusRunning;

  // répercute le changement d'état de running à completed | failed
  useEffect(() => {
    if (status.code !== UploadStatusCode.running) {
      onRunningStopped?.(file.name, status);
    }
  }, [status]);

  return (
    <div data-test="file-running" className="flex justify-between items-center">
      <div className="w-8/12 flex items-center">
        <div
          data-test="name"
          className="text-sm text-grey-8 whitespace-nowrap text-ellipsis overflow-hidden"
        >
          {file.name}
        </div>
        <div data-test="size" className="min-w-max text-sm text-grey-6 pl-2">
          ({formatFileSize(file.size)})
        </div>
      </div>
      <div className="w-3/12 flex items-center gap-1">
        {/** Progress bar */}
        <div className="w-80 h-3.5 inline-block bg-grey925">
          <div
            className="h-full bg-primary max-w-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <Button icon="close-line" variant="white" size="xs" onClick={abort} />
      </div>
    </div>
  );
};

const FileItemCompleted = (props: TFileItemProps) => {
  const { file } = props;
  return (
    <div data-test="file-completed" className="flex w-full">
      <div
        data-test="name"
        className="text-sm text-grey-8 whitespace-nowrap text-ellipsis overflow-hidden"
      >
        {file.name}
      </div>
      <div data-test="size" className="text-sm min-w-max text-grey-6 pl-2">
        ({formatFileSize(file.size)})
      </div>
    </div>
  );
};

const errorToLabel = {
  sizeError:
    'Ce fichier ne peut pas être téléversé car il dépasse la taille maximale autorisée',
  formatError:
    'Ce fichier ne peut pas être téléversé car son format n’est pas supporté',
  formatAndSizeError:
    'Ce fichier ne peut pas être téléversé car son format n’est pas supporté et il dépasse la taille maximale autorisée',
  uploadError: 'Ce fichier n’a pas pu être téléversé',
};

const FileItemFailed = (props: TFileItemProps) => {
  const { file, status, onRemoveFailed } = props;
  const { error } = status as UploadStatusFailed;
  const label = errorToLabel[error];
  return (
    <div
      data-test="file-failed"
      className="flex justify-between items-center group"
    >
      <div className="flex flex-col w-11/12">
        <div className="flex">
          <div
            data-test="name"
            className="text-sm text-grey-8 whitespace-nowrap text-ellipsis overflow-hidden"
          >
            {file.name}
          </div>
          <div data-test="size" className="text-sm min-w-max text-grey-6 pl-2">
            ({formatFileSize(file.size)})
          </div>
        </div>
        {status.code === UploadStatusCode.duplicated ? (
          <div className="text-xs text-grey-6 italic">
            Ce fichier sera ajouté directement via votre bibliothèque de
            fichiers car il a déjà été téléversé
            {file.name !== status.filename ? (
              <>
                {' '}
                sous le nom <i>{status.filename}.</i>
              </>
            ) : (
              '.'
            )}
          </div>
        ) : (
          <div data-test="error" className="text-xs text-error-1 italic">
            &nbsp;{label}
          </div>
        )}
      </div>
      <Button
        icon="close-line"
        size="xs"
        variant="white"
        className="invisible group-hover:visible w-fit h-fit"
        onClick={() => onRemoveFailed?.(file.name)}
      />
    </div>
  );
};

const statusToRenderer = {
  running: FileItemRunning,
  uploaded: FileItemCompleted,
  completed: FileItemCompleted,
  duplicated: FileItemFailed,
  failed: FileItemFailed,
  aborted: () => null,
};
