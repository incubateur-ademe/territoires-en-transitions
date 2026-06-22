import { appLabels } from '@/app/labels/catalog';
import { Button, Icon } from '@tet/ui';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';
import { JSX, ReactNode } from 'react';
import { ArchiveRowState } from './archive-output-to-row-state';

type ReferentielArchiveRowProps = {
  state: ArchiveRowState;
  referentielLabel: string;
  collectiviteNom: string;
  startedAtMs: number;
  getElapsedTime: (sinceMs: number) => number;
  onDownload: () => void;
  onRetry: () => void;
};

const iconByKind: Record<
  ArchiveRowState['kind'],
  { icon: string; className: string }
> = {
  preparing: { icon: 'loader-4-line', className: 'animate-spin text-primary-7' },
  ready: { icon: 'check-line', className: 'text-success' },
  error: { icon: 'error-warning-line', className: 'text-error-1' },
};

function ArchiveStatusIcon({
  kind,
}: {
  kind: ArchiveRowState['kind'];
}): JSX.Element {
  const { icon, className } = iconByKind[kind];
  return <Icon icon={icon} size="md" className={className} aria-hidden="true" />;
}

function ArchiveTitle({
  referentielLabel,
  collectiviteNom,
}: {
  referentielLabel: string;
  collectiviteNom: string;
}): JSX.Element {
  return (
    <span className="truncate text-sm font-semibold leading-tight text-primary-9">
      {appLabels.preuvesArchiveLigneTitre({
        referentiel: referentielLabel,
        collectivite: collectiviteNom,
      })}
    </span>
  );
}

function ArchiveStatusLine({
  elapsedLabel,
  progressLabel,
}: {
  elapsedLabel: string;
  progressLabel: string | null;
}): JSX.Element {
  return (
    <span className="text-xs leading-tight text-grey-7">
      {elapsedLabel}
      {progressLabel !== null && (
        <>
          {' · '}
          {progressLabel}
        </>
      )}
    </span>
  );
}

function ArchiveErrorLine({ message }: { message: string }): JSX.Element {
  return (
    <span className="mt-1 text-xs leading-tight text-error-1">{message}</span>
  );
}

function ArchiveRowAction({
  state,
  onDownload,
  onRetry,
}: {
  state: ArchiveRowState;
  onDownload: () => void;
  onRetry: () => void;
}): ReactNode {
  switch (state.kind) {
    case 'preparing':
      return null;
    case 'ready':
      return (
        <Button
          size="xs"
          variant="outlined"
          icon="download-line"
          title={appLabels.preuvesArchiveTelecharger}
          aria-label={appLabels.preuvesArchiveTelecharger}
          onClick={onDownload}
        />
      );
    case 'error':
      return state.retryable ? (
        <Button
          size="xs"
          variant="outlined"
          icon="refresh-line"
          title={appLabels.preuvesArchiveReessayer}
          aria-label={appLabels.preuvesArchiveReessayer}
          onClick={onRetry}
        />
      ) : null;
  }
}

function progressLabelFor(state: ArchiveRowState): string | null {
  if (state.kind === 'preparing' && !state.indeterminate) {
    return appLabels.preuvesArchiveProgression({
      processed: state.processed,
      total: state.total,
    });
  }
  if (state.kind === 'ready') {
    return appLabels.preuvesArchiveNombreFichiers({
      count: state.totalFiles,
    });
  }
  return null;
}

export function ReferentielArchiveRow({
  state,
  referentielLabel,
  collectiviteNom,
  startedAtMs,
  getElapsedTime,
  onDownload,
  onRetry,
}: ReferentielArchiveRowProps): JSX.Element {
  const elapsedLabel = formatDistance(
    0,
    Math.max(getElapsedTime(startedAtMs), 0),
    { locale: fr, addSuffix: true, includeSeconds: true }
  );

  const progressLabel = progressLabelFor(state);

  const errorMessage =
    state.kind === 'error'
      ? state.backendMessage ?? appLabels.preuvesArchiveErreurGenerique
      : null;

  return (
    <li className="flex items-center gap-3">
      <ArchiveStatusIcon kind={state.kind} />
      <div className="flex min-w-0 flex-1 flex-col">
        <ArchiveTitle
          referentielLabel={referentielLabel}
          collectiviteNom={collectiviteNom}
        />
        <ArchiveStatusLine
          elapsedLabel={elapsedLabel}
          progressLabel={progressLabel}
        />
        {errorMessage !== null && <ArchiveErrorLine message={errorMessage} />}
      </div>
      <ArchiveRowAction
        state={state}
        onDownload={onDownload}
        onRetry={onRetry}
      />
    </li>
  );
}
