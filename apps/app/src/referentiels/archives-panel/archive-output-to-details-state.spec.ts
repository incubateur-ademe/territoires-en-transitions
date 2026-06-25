import { describe, expect, it } from 'vitest';
import {
  archiveOutputToDetailsState,
  isArchiveInFlight,
  PreuvesArchiveListItem,
} from './archive-output-to-details-state';

type ItemOverrides = Partial<Omit<PreuvesArchiveListItem, 'status'>> & {
  status?: 'pending' | 'processing' | 'completed' | 'failed';
};

function makeItem(overrides: ItemOverrides = {}): PreuvesArchiveListItem {
  return {
    archiveId: '11111111-1111-1111-1111-111111111111',
    status: 'processing',
    totalFiles: 10,
    processedFiles: 3,
    createdAt: '2026-06-16 08:00:00+00',
    ...overrides,
  } as unknown as PreuvesArchiveListItem;
}

describe('archiveOutputToDetailsState', () => {
  it('mappe pending vers preparing avec progression', () => {
    const state = archiveOutputToDetailsState(
      makeItem({ status: 'pending', totalFiles: 8, processedFiles: 0 })
    );

    expect(state).toEqual({
      kind: 'preparing',
      processed: 0,
      total: 8,
      indeterminate: false,
    });
  });

  it('mappe processing vers preparing avec progression', () => {
    const state = archiveOutputToDetailsState(
      makeItem({ status: 'processing', totalFiles: 10, processedFiles: 4 })
    );

    expect(state).toEqual({
      kind: 'preparing',
      processed: 4,
      total: 10,
      indeterminate: false,
    });
  });

  it('marque la progression indeterminée tant que totalFiles vaut 0', () => {
    const state = archiveOutputToDetailsState(
      makeItem({ status: 'processing', totalFiles: 0, processedFiles: 0 })
    );

    expect(state).toEqual({
      kind: 'preparing',
      processed: 0,
      total: 0,
      indeterminate: true,
    });
  });

  it('mappe completed vers ready en conservant le nombre de fichiers', () => {
    const state = archiveOutputToDetailsState(
      makeItem({ status: 'completed', totalFiles: 12 })
    );

    expect(state).toEqual({ kind: 'ready', totalFiles: 12 });
  });

  it('mappe failed vers error retryable', () => {
    const state = archiveOutputToDetailsState(makeItem({ status: 'failed' }));

    expect(state).toEqual({
      kind: 'error',
      backendMessage: null,
      retryable: true,
    });
  });
});

describe('isArchiveInFlight', () => {
  it('est vrai pour pending et processing', () => {
    expect(isArchiveInFlight(makeItem({ status: 'pending' }))).toBe(true);
    expect(isArchiveInFlight(makeItem({ status: 'processing' }))).toBe(true);
  });

  it('est faux pour completed et failed', () => {
    expect(isArchiveInFlight(makeItem({ status: 'completed' }))).toBe(false);
    expect(isArchiveInFlight(makeItem({ status: 'failed' }))).toBe(false);
  });
});
