import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useTRPC } from '@tet/api';
import { useQueryClient } from '@tanstack/react-query';

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
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setToast } = useToastContext();

  return async (archiveId) => {
    try {
      const archive = await queryClient.fetchQuery({
        ...trpc.referentiels.preuvesArchive.get.queryOptions({ archiveId }),
        staleTime: 0,
      });
      if (archive.downloadUrl === null) {
        setToast('error', appLabels.preuvesArchiveErreurGenerique);
        return;
      }
      triggerBrowserDownload(archive.downloadUrl);
    } catch {
      setToast('error', appLabels.preuvesArchiveErreurGenerique);
    }
  };
}
