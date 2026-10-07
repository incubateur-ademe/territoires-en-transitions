import { appLabels } from '@/app/labels/catalog';
import { hasDownloadableFile } from '@/app/collectivites/documents/data/has-downloadable-file';
import { useDownloadDocumentsMesure } from '@/app/collectivites/documents/data/use-download-documents-mesure';
import { useListDocumentsMesure } from '@/app/collectivites/documents/data/use-list-documents-mesure';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { ActionListItem } from './use-list-actions';

type DownloadDocumentsButtonProps = {
  action: ActionListItem;
  className?: string;
};

export const DownloadDocumentsButton = ({
  action,
  className,
}: DownloadDocumentsButtonProps) => {
  const collectiviteId = useCollectiviteId();
  const documents = useListDocumentsMesure({
    collectiviteId,
    actionId: action.actionId,
    withSubActions: true,
  });
  const archiveDownload = useDownloadDocumentsMesure({
    collectiviteId,
    actionId: action.actionId,
  });

  if (archiveDownload.status === 'downloading') {
    return (
      <div className={cn('flex gap-4 items-center w-fit', className)}>
        <span className="text-sm text-grey-8">
          {appLabels.telechargementEnCours}
        </span>
        <Button
          onClick={archiveDownload.cancel}
          icon="close-line"
          variant="outlined"
          size="xs"
        >
          {appLabels.annuler}
        </Button>
      </div>
    );
  }

  return (
    <Button
      icon="download-line"
      disabled={!hasDownloadableFile(documents)}
      onClick={archiveDownload.download}
      size="xs"
      className={className}
    >
      {appLabels.telechargerTousDocuments}
    </Button>
  );
};
