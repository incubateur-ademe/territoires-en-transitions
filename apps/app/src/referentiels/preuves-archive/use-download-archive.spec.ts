import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appLabels } from '../../labels/catalog';
import { useDownloadArchive } from './use-download-archive';

const { fetchDownloadUrl, setToast } = vi.hoisted(() => ({
  fetchDownloadUrl: vi.fn(),
  setToast: vi.fn(),
}));

vi.mock('./data/use-fetch-archive-download-url', () => ({
  useFetchArchiveDownloadUrl: () => fetchDownloadUrl,
}));
vi.mock('../../utils/toast/toast-context', () => ({
  useToastContext: () => ({ setToast }),
}));

describe('useDownloadArchive', () => {
  beforeEach(() => {
    fetchDownloadUrl.mockReset();
    setToast.mockReset();
  });

  it("récupère l'URL signée par archiveId et n'affiche pas de toast", async () => {
    fetchDownloadUrl.mockResolvedValue('https://signed.test/archive.zip');
    const { result } = renderHook(() => useDownloadArchive());

    await result.current('a1');

    expect(fetchDownloadUrl).toHaveBeenCalledWith('a1');
    expect(setToast).not.toHaveBeenCalled();
  });

  it("affiche un toast d'erreur quand l'URL est nulle (archive indisponible)", async () => {
    fetchDownloadUrl.mockResolvedValue(null);
    const { result } = renderHook(() => useDownloadArchive());

    await result.current('a1');

    expect(setToast).toHaveBeenCalledWith(
      'error',
      appLabels.preuvesArchiveErreurGenerique
    );
  });

  it("affiche un toast d'erreur quand la récupération de l'URL échoue", async () => {
    fetchDownloadUrl.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useDownloadArchive());

    await result.current('a1');

    expect(setToast).toHaveBeenCalledWith(
      'error',
      appLabels.preuvesArchiveErreurGenerique
    );
  });
});
