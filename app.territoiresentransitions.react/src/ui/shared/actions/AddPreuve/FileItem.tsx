import {useEffect} from 'react';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  UploadStatus,
  UploadStatusCode,
  UploadStatusRunning,
  UploadStatusFailed,
} from './Uploader.d';
import {useUploader} from './useUploader';

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
  const collectiviteId = useCollectiviteId()!;
  const {status} = useUploader('' + collectiviteId, 'action_id', file);
  const {progress, abort} = status as UploadStatusRunning;

  // répercute le changement d'état de running à completed | failed
  useEffect(() => {
    if (status.code !== UploadStatusCode.running) {
      onRunningStopped?.(file.name, status);
    }
  }, [status]);

  return (
    <div className="pl-2 pr-4 py-1 flex justify-between">
      <div className="w-8/12 flex justify-between">
        <div className="text-sm font-bold whitespace-nowrap overflow-ellipsis overflow-hidden">
          {file.name}
        </div>
        <div className="min-w-max text-sm text-grey625 pl-2">
          ({formatFileSize(file.size)})
        </div>
      </div>
      <div className="w-3/12 flex items-center">
        <ProgressBar className="w-80 h-3.5 inline-block" value={progress} />
        <ButtonClose onClick={abort} />
      </div>
    </div>
  );
};

const FileItemCompleted = (props: TFileItemProps) => {
  const {file} = props;
  return (
    <div className="px-2 py-1 text-sm text-bf500 w-full font-bold whitespace-nowrap overflow-ellipsis overflow-hidden">
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
  uploadError: 'Ce fichier n’a pas pu être téléversé',
};

const FileItemFailed = (props: TFileItemProps) => {
  const {file, status, onRemoveFailed} = props;
  const {error} = status as UploadStatusFailed;
  const label = errorToLabel[error];
  return (
    <div className="py-1 group flex flex-col hover:bg-grey925">
      <div className="px-2 pt-1 flex justify-between">
        <div className="flex w-11/12">
          <div className="text-sm whitespace-nowrap overflow-ellipsis overflow-hidden">
            {file.name}
          </div>
          <div className="text-sm min-w-max text-grey625 pl-2">
            ({formatFileSize(file.size)})
          </div>
        </div>
        <ButtonClose
          className="invisible group-hover:visible"
          onClick={() => onRemoveFailed?.(file.name)}
        />
      </div>
      <div className="px-2 py-2 fr-fi-alert-line fr-fi--sm text-error425 text-xs">
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

const ProgressBar = ({
  value,
  className,
}: {
  value: number;
  className?: string;
}) => (
  <div className={className}>
    <div className="w-full h-full bg-grey925">
      <div
        className="h-full bg-bf525 max-w-full"
        style={{width: `${value}%`}}
      ></div>
    </div>
  </div>
);

const SmallIconButton = ({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`ml-1 px-1 w-7 text-sm inline-block text-center ${className}`}
    {...props}
  />
);

const ButtonClose = ({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <SmallIconButton className={`fr-fi-close-line ${className}`} {...props} />
);
