import { referentielToName } from '@/app/app/labels';
import { appLabels } from '@/app/labels/catalog';
import { ReferentielId } from '@tet/domain/referentiels';
import { Button } from '@tet/ui';
import { JSX, ReactNode } from 'react';
import {
  archiveOutputToRowState,
  isArchiveInFlight,
  PreuvesArchiveListItem,
} from './archive-output-to-row-state';
import { useListPreuvesArchive } from './data/use-list-preuves-archive';
import { DownloadsPanel } from './downloads-panel';
import { ReferentielArchiveRow } from './referentiel-archive-row';
import { useDownloadArchive } from './use-download-archive';
import { useGenerateArchive } from './use-generate-archive';
import { useTickingNow } from './use-ticking-now';

export type ArchivesPanelParams = {
  collectiviteId: number;
  collectiviteNom: string;
  referentielId: ReferentielId;
  canGenerate: boolean;
};

function NoArchivePlaceholder(): JSX.Element {
  return (
    <li className="m-0 text-sm text-grey-7">{appLabels.preuvesArchiveAucune}</li>
  );
}

function ScreenReaderAnnouncement({
  message,
}: {
  message: string;
}): JSX.Element {
  return (
    <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </span>
  );
}

function archivesAnnouncement(archives: PreuvesArchiveListItem[]): string {
  const kinds = archives.map((archive) => archiveOutputToRowState(archive).kind);
  const enCours = kinds.filter((kind) => kind === 'preparing').length;
  if (enCours > 0) {
    return appLabels.preuvesArchiveAnnonceEnCours({ count: enCours });
  }
  if (kinds.includes('error')) {
    return appLabels.preuvesArchiveAnnonceEchec;
  }
  const pretes = kinds.filter((kind) => kind === 'ready').length;
  if (pretes > 0) {
    return appLabels.preuvesArchiveAnnoncePretes({ count: pretes });
  }
  return '';
}

export function ArchivesPanel({
  collectiviteId,
  collectiviteNom,
  referentielId,
  canGenerate,
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
  const getElapsedTime = (sinceMs: number): number => nowMs - sinceMs;

  const generateButton = (
    <Button
      size="sm"
      variant="outlined"
      icon="folder-zip-line"
      disabled={!canGenerate || isGenerating}
      onClick={generate}
    >
      {appLabels.preuvesArchiveGenerer}
    </Button>
  );

  return (
    <>
      <ScreenReaderAnnouncement message={archivesAnnouncement(archives)} />
      <DownloadsPanel onClose={onClose} action={generateButton}>
        {archives.length === 0 ? (
          <NoArchivePlaceholder />
        ) : (
          archives.map((item) => (
            <ReferentielArchiveRow
              key={item.archiveId}
              state={archiveOutputToRowState(item)}
              referentielLabel={referentielToName[referentielId]}
              collectiviteNom={collectiviteNom}
              startedAtMs={new Date(item.createdAt).getTime()}
              getElapsedTime={getElapsedTime}
              onDownload={() => downloadArchive(item.archiveId)}
              onRetry={generate}
            />
          ))
        )}
      </DownloadsPanel>
    </>
  );
}
