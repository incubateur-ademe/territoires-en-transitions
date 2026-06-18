import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useFetchArchiveDownloadUrl } from './data/use-fetch-archive-download-url';

function triggerBrowserDownload(url: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function useDownloadArchive(): (archiveId: string) => Promise<void> {
  const { setToast } = useToastContext();
  const fetchDownloadUrl = useFetchArchiveDownloadUrl();

  return async (archiveId) => {
    try {
      const downloadUrl = await fetchDownloadUrl(archiveId);
      if (downloadUrl === null) {
        setToast('error', appLabels.preuvesArchiveErreurGenerique);
        return;
      }
      triggerBrowserDownload(downloadUrl);
    } catch {
      setToast('error', appLabels.preuvesArchiveErreurGenerique);
    }
  };
}
