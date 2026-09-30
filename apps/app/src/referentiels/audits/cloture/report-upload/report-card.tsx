import { appLabels } from '@/app/labels/catalog';
import { useOpenPreuve } from '@/app/collectivites/documents/bibliotheque/use-open-preuve';
import { DocumentLastModified } from '@/app/collectivites/documents/bibliotheque/document-last-modified';
import { DocumentTitle } from '@/app/collectivites/documents/bibliotheque/document-title';
import { getDocumentFilename } from '@tet/domain/collectivites';
import { MissingFileBadge } from '@/app/collectivites/documents/bibliotheque/missing-file.badge';
import { Button, Card } from '@tet/ui';
import { JSX } from 'react';
import { AuditReport } from '../data/use-list-reports-by-audit';

type RemoveReportButtonProps = {
  filename: string;
  isRemoving: boolean;
  onClick: () => void;
};

const RemoveReportButton = ({
  filename,
  isRemoving,
  onClick,
}: RemoveReportButtonProps): JSX.Element => (
  <Button
    icon="delete-bin-line"
    variant="white"
    size="xs"
    loading={isRemoving}
    disabled={isRemoving}
    aria-label={
      isRemoving
        ? appLabels.suppressionRapportEnCours({ filename })
        : appLabels.supprimerRapportAudit({ filename })
    }
    onClick={onClick}
  />
);

const UploadingTitle = ({
  filename,
  progress,
}: {
  filename: string;
  progress: number;
}): JSX.Element => (
  <span className="flex-1 text-base font-bold text-grey-6 opacity-50">
    {filename}
    <span className="ml-2 text-grey-7 text-sm font-medium" aria-hidden="true">
      {appLabels.progressionUpload({ progress })}
    </span>
    <span className="sr-only">
      {appLabels.televersementDuFichier({ filename, progress })}
    </span>
  </span>
);

type PersistedReportCardProps = {
  report: AuditReport;
  isRemoving: boolean;
  onRemove: () => void;
};

export const PersistedReportCard = ({
  report,
  isRemoving,
  onRemove,
}: PersistedReportCardProps): JSX.Element => {
  const openPreuve = useOpenPreuve({ collectiviteId: report.collectiviteId });
  const filename = getDocumentFilename(report) ?? '';
  const isMissing = report.type === 'fichierManquant';
  return (
    <Card className="p-4 gap-1" aria-busy={isRemoving}>
      <div className="flex items-center gap-1">
        {isMissing && <MissingFileBadge />}
        <div className="min-w-0 flex-1">
          <DocumentTitle
            document={report}
            onOpen={() => openPreuve(report)}
            disabled={isRemoving}
            withExtension
            withFilesize
          />
        </div>
        <RemoveReportButton
          filename={filename}
          isRemoving={isRemoving}
          onClick={onRemove}
        />
      </div>
      <DocumentLastModified
        modifiedAt={report.modifiedAt}
        modifiedByNom={report.modifiedByNom}
      />
    </Card>
  );
};

export const UploadingReportCard = ({
  filename,
  progress,
}: {
  filename: string;
  progress: number;
}): JSX.Element => (
  <Card className="p-4 gap-1 animate-pulse" aria-busy>
    <div className="flex items-center gap-1">
      <UploadingTitle filename={filename} progress={progress} />
    </div>
  </Card>
);
