import { VisibleWhen } from '@tet/ui';
import { JSX } from 'react';
import { AuditReport } from '../data/use-list-reports-by-audit';
import { UploadingReport } from '../data/use-upload-audit-report';
import { PersistedReportCard, UploadingReportCard } from './report-card';

export const ReportsList = ({
  reports,
  uploadingReport,
  removingReportIds,
  onRemove,
}: {
  reports: Array<AuditReport>;
  uploadingReport: UploadingReport | null;
  removingReportIds: ReadonlySet<number>;
  onRemove: (report: AuditReport) => void;
}): JSX.Element => (
  <ul className="flex flex-col gap-2 list-none p-0 m-0">
    {reports.map((report) => (
      <li key={report.id}>
        <PersistedReportCard
          report={report}
          isRemoving={removingReportIds.has(report.id)}
          onRemove={() => onRemove(report)}
        />
      </li>
    ))}
    <VisibleWhen condition={uploadingReport !== null}>
      <li key="uploading">
        <UploadingReportCard
          filename={uploadingReport?.filename ?? ''}
          progress={uploadingReport?.progress ?? 0}
        />
      </li>
    </VisibleWhen>
  </ul>
);
