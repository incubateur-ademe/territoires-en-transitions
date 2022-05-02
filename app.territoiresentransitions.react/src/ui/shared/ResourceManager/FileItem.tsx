import {useEffect} from 'react';
import {
  UploadStatus,
  UploadStatusCode,
  UploadStatusRunning,
  UploadStatusFailed,
} from 'ui/shared/ResourceManager/Uploader.d';
import {useUploader} from 'ui/shared/ResourceManager/useUploader';
import {ButtonClose} from 'ui/shared/SmallIconButton';
import {ProgressBar} from 'ui/shared/ProgressBar';

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

export type TFileItemProps = TFileItem; //& {};

/**
 * Affiche un item représentant un fichier
 */
export const FileItem = (props: TFileItemProps) => {
  const {status} = props;
  const code: UploadStatusCode = status?.code || '';
  const Renderer = statusToRenderer[code];
  return Renderer ? <Renderer {...props} /> : null;
};

const FileItemRunning = (props: TFileItemProps) => {
  const {file, onRunningStopped} = props;
  const {status} = useUploader(file);
  const {progress, abort} = status as UploadStatusRunning;

  // répercute le changement d'état de running à completed | failed
  useEffect(() => {
    if (status.code !== UploadStatusCode.running) {
      onRunningStopped?.(file.name, status);
    }
  }, [status]);

  return (
    <div
      data-test="file-running"
      className="pl-2 pr-4 py-1 flex justify-between"
    >
      <div className="w-8/12 flex justify-between">
        <div
          data-test="name"
          className="text-sm font-bold whitespace-nowrap overflow-ellipsis overflow-hidden"
        >
          {file.name}
        </div>
        <div data-test="size" className="min-w-max text-sm text-grey625 pl-2">
          ({formatFileSize(file.size)})
        </div>
      </div>
      <div className="w-3/12 flex items-center">
        <ProgressBar className="w-80 h-3.5 inline-block" value={progress} />
        <ButtonClose
          onClick={e => {
            e.preventDefault();
            abort?.();
          }}
        />
      </div>
    </div>
  );
};

const FileItemCompleted = (props: TFileItemProps) => {
  const {file} = props;
  return (
    <div
      data-test="file-completed"
      className="px-2 py-1 text-sm text-bf500 w-full font-bold whitespace-nowrap overflow-ellipsis overflow-hidden"
    >
      {file.name}
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
  duplicateError:
    'Ce fichier a déjà été téléversé. Il peut être ajouté depuis la bibliothèque.',
  uploadError: 'Ce fichier n’a pas pu être téléversé',
};

const FileItemFailed = (props: TFileItemProps) => {
  const {file, status, onRemoveFailed} = props;
  const {error} = status as UploadStatusFailed;
  const label = errorToLabel[error];
  return (
    <div
      data-test="file-failed"
      className="py-1 mr-4 group flex flex-col hover:bg-grey925"
    >
      <div className="px-2 pt-1 flex justify-between">
        <div className="flex w-11/12">
          <div
            data-test="name"
            className="text-sm whitespace-nowrap overflow-ellipsis overflow-hidden"
          >
            {file.name}
          </div>
          <div data-test="size" className="text-sm min-w-max text-grey625 pl-2">
            ({formatFileSize(file.size)})
          </div>
        </div>
        <ButtonClose
          className="invisible group-hover:visible"
          onClick={() => onRemoveFailed?.(file.name)}
        />
      </div>
      <div
        data-test="error"
        className="px-2 py-2 fr-fi-alert-line fr-fi--sm text-error425 text-xs"
      >
        &nbsp;{label}
      </div>
    </div>
  );
};

const statusToRenderer = {
  running: FileItemRunning,
  completed: FileItemCompleted,
  failed: FileItemFailed,
  aborted: () => null,
};

const formatFileSize = (size: number) => {
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (
    Number((size / Math.pow(1024, i)).toFixed(2)) +
    ' ' +
    ['o', 'Ko', 'Mo', 'Go', 'To'][i]
  );
};
