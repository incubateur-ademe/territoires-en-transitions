import { referentielToName } from '@/app/app/labels';
import { appLabels } from '@/app/labels/catalog';
import { ReferentielId } from '@tet/domain/referentiels';
import { Button } from '@tet/ui';
import { JSX, ReactNode } from 'react';
import {
  archiveOutputToDetailsState,
  isArchiveInFlight,
} from './archive-output-to-details-state';
import { ArchivesPanelLayout } from './archives-panel-layout';
import { useDownloadArchive } from './data/use-download-archive';
import { useGenerateArchive } from './data/use-generate-archive';
import { useListPreuvesArchive } from './data/use-list-preuves-archive';
import { ArchiveDetails } from './archive-details';
import { useTickingNow } from './use-ticking-now';

export type ArchivesPanelParams = {
  collectiviteId: number;
  collectiviteNom: string;
  referentielId: ReferentielId;
};

function NoArchivePlaceholder(): JSX.Element {
  return (
    <li className="m-0 text-sm text-grey-7">{appLabels.preuvesArchiveAucune}</li>
  );
}

export function ArchivesPanel({
  collectiviteId,
  collectiviteNom,
  referentielId,
  onClose,
}: ArchivesPanelParams & { onClose: () => void }): ReactNode {
  const { data: archives = [] } = useListPreuvesArchive(
    collectiviteId,
    referentielId
  );
  const { generate, isGenerating } = useGenerateArchive({
    collectiviteId,
    referentielId,
  });
  const downloadArchive = useDownloadArchive();
  const nowMs = useTickingNow(archives.some(isArchiveInFlight));

  const generateButton = (
    <Button
      size="sm"
      variant="outlined"
      icon="folder-zip-line"
      disabled={isGenerating}
      onClick={generate}
    >
      {appLabels.preuvesArchiveGenerer}
    </Button>
  );

  return (
    <ArchivesPanelLayout onClose={onClose} action={generateButton}>
      {archives.length === 0 ? (
        <NoArchivePlaceholder />
      ) : (
        archives.map((item) => (
          <ArchiveDetails
            key={item.archiveId}
            state={archiveOutputToDetailsState(item)}
            referentielLabel={referentielToName[referentielId]}
            collectiviteNom={collectiviteNom}
            getElapsedTime={() => nowMs - new Date(item.createdAt).getTime()}
            onDownload={() => downloadArchive(item.archiveId)}
            onRetry={generate}
          />
        ))
      )}
    </ArchivesPanelLayout>
  );
}
