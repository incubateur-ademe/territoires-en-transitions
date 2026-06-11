import { appLabels } from '@/app/labels/catalog';
import { openPreuve } from '@/app/referentiels/preuves/Bibliotheque/openPreuve';
import {
  getAuthorAndDate,
  getFormattedTitle,
} from '@/app/referentiels/preuves/Bibliotheque/utils';
import { Button, Card } from '@tet/ui';
import { JSX } from 'react';
import { auditReportToPreuve } from '@/app/referentiels/preuves/mappers/audit-report-to-preuve';
import { AuditReport } from '../data/use-list-reports-by-audit';

const ReportMetadata = ({ text }: { text: string | null }): JSX.Element => (
  <>
    {text && (
      <span className="text-grey-6 text-sm font-medium">{text}</span>
    )}
  </>
);

const DownloadableTitle = ({
  title,
  onClick,
  disabled,
}: {
  title: string;
  onClick: () => void;
  disabled: boolean;
}): JSX.Element => (
  <button
    type="button"
    className="flex-1 text-left text-base font-bold transition text-primary-9 hover:text-primary-8 cursor-pointer disabled:text-grey-6 disabled:opacity-50 disabled:cursor-default"
    title={appLabels.telechargerFichier}
    disabled={disabled}
    onClick={onClick}
  >
    {title}
  </button>
);

const RemoveReportButton = ({
  filename,
  isRemoving,
  onClick,
}: {
  filename: string;
  isRemoving: boolean;
  onClick: () => void;
}): JSX.Element => (
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

export const PersistedReportCard = ({
  report,
  isRemoving,
  onRemove,
}: {
  report: AuditReport;
  isRemoving: boolean;
  onRemove: () => void;
}): JSX.Element => {
  const preuve = auditReportToPreuve(report);
  const filename = preuve.fichier?.filename ?? '';
  return (
    <Card className="p-4 gap-1" aria-busy={isRemoving}>
      <div className="flex items-start gap-1">
        <DownloadableTitle
          title={getFormattedTitle(preuve) ?? ''}
          onClick={() => openPreuve(preuve)}
          disabled={isRemoving}
        />
        <RemoveReportButton
          filename={filename}
          isRemoving={isRemoving}
          onClick={onRemove}
        />
      </div>
      <ReportMetadata
        text={getAuthorAndDate(report.created_at, report.created_by_nom)}
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
    <div className="flex items-start gap-1">
      <UploadingTitle filename={filename} progress={progress} />
    </div>
  </Card>
);
