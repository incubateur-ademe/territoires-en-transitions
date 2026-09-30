import { VisibleWhen } from '@tet/ui';
import { JSX } from 'react';
import { RapportAudit } from '../data/use-list-rapports-by-audit';
import { UploadingRapport } from '../data/use-upload-rapport-audit';
import { PersistedRapportCard, UploadingRapportCard } from './rapport.card';

export const RapportsList = ({
  reports,
  uploadingRapport,
  removingRapportIds,
  onRemove,
}: {
  reports: Array<RapportAudit>;
  uploadingRapport: UploadingRapport | null;
  removingRapportIds: ReadonlySet<number>;
  onRemove: (report: RapportAudit) => void;
}): JSX.Element => (
  <ul className="flex flex-col gap-2 list-none p-0 m-0">
    {reports.map((report) => (
      <li key={report.id}>
        <PersistedRapportCard
          report={report}
          isRemoving={removingRapportIds.has(report.id)}
          onRemove={() => onRemove(report)}
        />
      </li>
    ))}
    <VisibleWhen condition={uploadingRapport !== null}>
      <li key="uploading">
        <UploadingRapportCard
          filename={uploadingRapport?.filename ?? ''}
          progress={uploadingRapport?.progress ?? 0}
        />
      </li>
    </VisibleWhen>
  </ul>
);
