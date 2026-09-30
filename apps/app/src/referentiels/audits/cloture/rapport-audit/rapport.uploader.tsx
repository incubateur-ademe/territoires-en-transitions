import { appLabels } from '@/app/labels/catalog';
import { EXPECTED_FORMATS_LIST } from '@/app/collectivites/documents/upload/constants';
import { Field, Icon, Input, Spacer, VisibleWhen } from '@tet/ui';
import { JSX } from 'react';
import { RapportAuditUploadState } from '../data/use-upload-rapport-audit';
import { RapportsList } from './rapports.list';

const RapportDropzone = ({
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

type RapportAuditUploaderProps = Pick<
  RapportAuditUploadState,
  | 'reports'
  | 'uploadingRapport'
  | 'removingRapportIds'
  | 'uploadRapport'
  | 'removeRapport'
>;

export const RapportAuditUploader = ({
  reports,
  uploadingRapport,
  removingRapportIds,
  uploadRapport,
  removeRapport,
}: RapportAuditUploaderProps): JSX.Element => {
  const canAddRapport = reports.length === 0 && uploadingRapport === null;

  return (
    <div className="flex flex-col">
      <Field
        title={appLabels.ajouterRapportAudit}
        state="info"
        className="font-medium text-grey-8 text-sm"
      >
        <RapportsList
          reports={reports}
          uploadingRapport={uploadingRapport}
          removingRapportIds={removingRapportIds}
          onRemove={removeRapport}
        />
        <VisibleWhen condition={canAddRapport}>
          <RapportDropzone onDropFiles={uploadRapport} />
        </VisibleWhen>
      </Field>
      <Spacer height={0.5} />
      <ReplacementInfoBanner />
    </div>
  );
};
