import { appLabels } from '@/app/labels/catalog';
import { formatFileSize } from '@/app/utils/file';
import { Button } from '@tet/ui';
import { JSX } from 'react';
import { match } from 'ts-pattern';
import {
  UploadStatus,
  UploadStatusCode,
  UploadStatusDuplicated,
  UploadStatusFailed,
  UploadStatusPreparing,
  UploadStatusRunning,
} from './types';

export type FileUploadItem = {
  id: string;
  file: File;
  status: UploadStatus;
};

export type FileItemProps = {
  item: FileUploadItem;
  onDismissItem?: (itemId: string) => void;
};

const FileIdentity = ({ file }: { file: File }): JSX.Element => (
  <>
    <div
      data-test="name"
      className="text-sm text-grey-8 whitespace-nowrap text-ellipsis overflow-hidden"
    >
      {file.name}
    </div>
    <div data-test="size" className="min-w-max text-sm text-grey-6 pl-2">
      {`(${formatFileSize(file.size)})`}
    </div>
  </>
);

const FileItemInProgress = ({
  file,
  status,
}: {
  file: File;
  status: UploadStatusPreparing | UploadStatusRunning;
}): JSX.Element => (
  <div data-test="file-running" className="flex justify-between items-center">
    <div className="w-8/12 flex items-center">
      <FileIdentity file={file} />
    </div>
    <div className="w-3/12 flex items-center gap-1">
      <div className="w-80 h-3.5 inline-block bg-grey925">
        <ProgressFill status={status} />
      </div>
      <Button
        icon="close-line"
        variant="white"
        size="xs"
        onClick={status.abort}
      />
    </div>
  </div>
);

const ProgressFill = ({
  status,
}: {
  status: UploadStatusPreparing | UploadStatusRunning;
}): JSX.Element => {
  const isAwaitingFirstByte = status.code === UploadStatusCode.preparing;
  if (isAwaitingFirstByte) {
    return <div className="h-full bg-primary w-full animate-pulse" />;
  }
  return (
    <div
      className="h-full bg-primary max-w-full"
      style={{ width: `${status.progress}%` }}
    />
  );
};

const FileItemCompleted = ({ file }: { file: File }): JSX.Element => (
  <div data-test="file-completed" className="flex w-full">
    <FileIdentity file={file} />
  </div>
);

const errorToLabel = {
  sizeError: appLabels.fichierErreurTailleMax,
  formatError: appLabels.fichierErreurFormat,
  formatAndSizeError: appLabels.fichierErreurFormatEtTailleMax,
  uploadError: appLabels.fichierErreurTeleversement,
};

const DismissableNotice = ({
  file,
  status,
}: {
  file: File;
  status: UploadStatusFailed | UploadStatusDuplicated;
}): JSX.Element => {
  if (status.code === UploadStatusCode.duplicated) {
    return (
      <div className="text-xs text-grey-6 italic">
        {appLabels.fichierDupliqueNomConserve({
          nomFichier: file.name,
          nomEnregistre: status.filename,
        })}
      </div>
    );
  }
  return (
    <div data-test="error" className="text-xs text-error-1 italic">
      &nbsp;{errorToLabel[status.error]}
    </div>
  );
};

const FileItemDismissable = ({
  item,
  status,
  onDismissItem,
}: {
  item: FileUploadItem;
  status: UploadStatusFailed | UploadStatusDuplicated;
  onDismissItem?: (itemId: string) => void;
}): JSX.Element => (
  <div
    data-test="file-failed"
    className="flex justify-between items-center group"
  >
    <div className="flex flex-col w-11/12">
      <div className="flex">
        <FileIdentity file={item.file} />
      </div>
      <DismissableNotice file={item.file} status={status} />
    </div>
    <Button
      icon="close-line"
      size="xs"
      variant="white"
      className="invisible group-hover:visible w-fit h-fit"
      onClick={() => onDismissItem?.(item.id)}
    />
  </div>
);

export const FileItem = ({ item, onDismissItem }: FileItemProps): JSX.Element =>
  match(item.status)
    .with({ code: UploadStatusCode.preparing }, (status) => (
      <FileItemInProgress file={item.file} status={status} />
    ))
    .with({ code: UploadStatusCode.running }, (status) => (
      <FileItemInProgress file={item.file} status={status} />
    ))
    .with({ code: UploadStatusCode.completed }, () => (
      <FileItemCompleted file={item.file} />
    ))
    .with({ code: UploadStatusCode.duplicated }, (status) => (
      <FileItemDismissable
        item={item}
        status={status}
        onDismissItem={onDismissItem}
      />
    ))
    .with({ code: UploadStatusCode.failed }, (status) => (
      <FileItemDismissable
        item={item}
        status={status}
        onDismissItem={onDismissItem}
      />
    ))
    .exhaustive();
