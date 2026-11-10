import { appLabels } from '@/app/labels/catalog';
import { RouterOutput } from '@tet/api';
import { match } from 'ts-pattern';

export type PreuvesArchiveListItem =
  RouterOutput['referentiels']['preuvesArchive']['list'][number];

export type ArchiveDetailsState =
  | { kind: 'preparing'; processed: number; total: number; indeterminate: boolean }
  | { kind: 'ready'; totalFiles: number }
  | { kind: 'error'; message: string | null; retryable: boolean };

type ArchiveErrorCode = NonNullable<PreuvesArchiveListItem['errorCode']>;

// Causes liées à une limite : relancer produirait le même échec.
const messageByErrorCode: Record<ArchiveErrorCode, string> = {
  TOO_MANY_FILES: appLabels.preuvesTelechargementErreurTropDeFichiers,
  ARCHIVE_TOO_LARGE: appLabels.preuvesTelechargementErreurArchiveTropVolumineuse,
};

export function isArchiveInFlight(item: PreuvesArchiveListItem): boolean {
  return item.status === 'pending' || item.status === 'processing';
}

export function archiveOutputToDetailsState(
  item: PreuvesArchiveListItem
): ArchiveDetailsState {
  return match(item.status)
    .with('pending', 'processing', () => ({
      kind: 'preparing' as const,
      processed: item.processedFiles,
      total: item.totalFiles,
      indeterminate: item.totalFiles === 0,
    }))
    .with('completed', () => ({
      kind: 'ready' as const,
      totalFiles: item.totalFiles,
    }))
    .with('failed', () => ({
      kind: 'error' as const,
      message: item.errorCode ? messageByErrorCode[item.errorCode] : null,
      retryable: !item.errorCode,
    }))
    .exhaustive();
}
