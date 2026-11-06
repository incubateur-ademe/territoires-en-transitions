import { appLabels } from '@/app/labels/catalog';
import { formatFileSize, getExtension } from '@/app/utils/file';
import { Button, Icon } from '@tet/ui';
import { JSX } from 'react';
import { FileUploadItem } from './file-item';
import { UploadStatusCode } from './types';

/**
 * Fichier retenu quand le dépôt n'en accepte qu'un : il prend la place de la
 * zone de dépôt, pour qu'on voie d'un coup d'œil ce qui sera ajouté.
 */
export const SelectedFileCard = ({
  item,
  onRemove,
}: {
  item: FileUploadItem;
  onRemove: () => void;
}): JSX.Element => {
  const { file, status } = item;
  const isPdf = getExtension(file.name)?.toLowerCase() === 'pdf';
  const isInProgress =
    status.code === UploadStatusCode.preparing ||
    status.code === UploadStatusCode.running;

  return (
    <div
      data-test="selected-file"
      className="flex items-center gap-3 rounded-lg border border-grey-3 bg-white px-4 py-3"
    >
      <Icon
        icon={isPdf ? 'file-pdf-2-line' : 'file-text-line'}
        size="lg"
        className={isPdf ? 'text-error-1' : 'text-primary-7'}
      />
      <div className="flex min-w-0 grow flex-col gap-0.5">
        <span
          data-test="name"
          className="truncate text-sm font-bold text-primary-9"
        >
          {file.name}
        </span>
        <span data-test="size" className="text-xs text-grey-7">
          {formatFileSize(file.size)}
        </span>
        {isInProgress && (
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-grey-3">
            <div
              className={
                status.code === UploadStatusCode.preparing
                  ? 'h-full w-full animate-pulse bg-primary-7'
                  : 'h-full bg-primary-7'
              }
              style={
                status.code === UploadStatusCode.running
                  ? { width: `${status.progress}%` }
                  : undefined
              }
            />
          </div>
        )}
        {status.code === UploadStatusCode.duplicated && (
          <span className="text-xs italic text-grey-6">
            {appLabels.fichierDupliqueNomConserve({
              nomFichier: file.name,
              nomEnregistre: status.filename,
            })}
          </span>
        )}
      </div>
      <Button
        icon="close-line"
        variant="outlined"
        size="xs"
        aria-label={appLabels.fichierRetirerSelection}
        title={appLabels.fichierRetirerSelection}
        onClick={isInProgress ? status.abort : onRemove}
        dataTest="selected-file.retirer"
      />
    </div>
  );
};
