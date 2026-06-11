import { appLabels } from '@/app/labels/catalog';
import { EXPECTED_FORMATS_LIST } from '@/app/referentiels/preuves/upload/constants';
import { Field, Icon, Input, Spacer, VisibleWhen } from '@tet/ui';
import { JSX } from 'react';
import { AuditReportUploadState } from '../data/use-upload-audit-report';
import { ReportsList } from './audit-reports.list';

const ReportDropzone = ({
  onDropFiles,
}: {
  onDropFiles: (files: FileList | null) => Promise<void>;
}): JSX.Element => (
  <Input
    type="file"
    accept={EXPECTED_FORMATS_LIST}
    displaySize="md"
    onChange={(e) => {
      // Reset après lecture pour que sélectionner le même fichier
      // re-déclenche onChange (cas du re-dépôt après suppression).
      const { files } = e.target;
      onDropFiles(files);
      e.target.value = '';
    }}
    onDropFiles={(files) => onDropFiles(files)}
  />
);

const ReplacementInfoBanner = (): JSX.Element => (
  <aside className="flex items-start gap-1 rounded-md">
    <Icon
      icon="information-fill"
      aria-hidden="true"
      size="md"
      className="text-info-1 shrink-0"
    />
    <p className="text-sm text-info-1">
      {appLabels.infoRemplacementRapportAudit}
    </p>
  </aside>
);

type AuditReportUploaderProps = Pick<
  AuditReportUploadState,
  | 'reports'
  | 'uploadingReport'
  | 'removingReportIds'
  | 'uploadReport'
  | 'removeReport'
>;

export const AuditReportUploader = ({
  reports,
  uploadingReport,
  removingReportIds,
  uploadReport,
  removeReport,
}: AuditReportUploaderProps): JSX.Element => {
  const canAddReport = reports.length === 0 && uploadingReport === null;

  return (
    <div className="flex flex-col">
      <Field
        title={appLabels.ajouterRapportAudit}
        state="info"
        className="font-medium text-grey-8 text-sm"
      >
        <ReportsList
          reports={reports}
          uploadingReport={uploadingReport}
          removingReportIds={removingReportIds}
          onRemove={removeReport}
        />
        <VisibleWhen condition={canAddReport}>
          <ReportDropzone onDropFiles={uploadReport} />
        </VisibleWhen>
      </Field>
      <Spacer height={0.5} />
      <ReplacementInfoBanner />
    </div>
  );
};
