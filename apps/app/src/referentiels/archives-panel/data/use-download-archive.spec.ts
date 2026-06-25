import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appLabels } from '../../../labels/catalog';
import { useDownloadArchive } from './use-download-archive';

const { fetchQuery, getQueryOptions, setToast } = vi.hoisted(() => ({
  fetchQuery: vi.fn(),
  getQueryOptions: vi.fn(() => ({})),
  setToast: vi.fn(),
}));

vi.mock('@tet/api', () => ({
  useTRPC: () => ({
    referentiels: { preuvesArchive: { get: { queryOptions: getQueryOptions } } },
  }),
}));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ fetchQuery }),
}));
vi.mock('../../../utils/toast/toast-context', () => ({
  useToastContext: () => ({ setToast }),
}));

describe('useDownloadArchive', () => {
  beforeEach(() => {
    fetchQuery.mockReset();
    getQueryOptions.mockClear();
    setToast.mockReset();
  });

  it("récupère l'URL signée par archiveId et n'affiche pas de toast", async () => {
    fetchQuery.mockResolvedValue({
      downloadUrl: 'https://signed.test/archive.zip',
    });
    const { result } = renderHook(() => useDownloadArchive());

    await result.current('a1');

    expect(getQueryOptions).toHaveBeenCalledWith({ archiveId: 'a1' });
    expect(setToast).not.toHaveBeenCalled();
  });

  it("affiche un toast d'erreur quand l'URL est nulle (archive indisponible)", async () => {
    fetchQuery.mockResolvedValue({ downloadUrl: null });
    const { result } = renderHook(() => useDownloadArchive());

    await result.current('a1');

    expect(setToast).toHaveBeenCalledWith(
      'error',
      appLabels.preuvesArchiveErreurGenerique
    );
  });

  it("affiche un toast d'erreur quand la récupération de l'URL échoue", async () => {
    fetchQuery.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useDownloadArchive());

    await result.current('a1');

    expect(setToast).toHaveBeenCalledWith(
      'error',
      appLabels.preuvesArchiveErreurGenerique
    );
  });
});
