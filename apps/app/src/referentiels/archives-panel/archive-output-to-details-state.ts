import { RouterOutput } from '@tet/api';
import { match } from 'ts-pattern';

export type PreuvesArchiveListItem =
  RouterOutput['referentiels']['preuvesArchive']['list'][number];

export type ArchiveDetailsState =
  | { kind: 'preparing'; processed: number; total: number; indeterminate: boolean }
  | { kind: 'ready'; totalFiles: number }
  | { kind: 'error'; backendMessage: string | null; retryable: boolean };

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
      backendMessage: null,
      retryable: true,
    }))
    .exhaustive();
}
