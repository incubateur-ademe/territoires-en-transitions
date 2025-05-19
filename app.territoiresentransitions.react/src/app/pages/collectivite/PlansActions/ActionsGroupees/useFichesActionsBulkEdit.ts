import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';

export const useFichesActionsBulkEdit = () => {
  const collectiviteId = useCollectiviteId();
  const trpcUtils = trpc.useUtils();

  return trpc.plans.fiches.bulkEdit.useMutation({
    onSuccess() {
      trpcUtils.plans.fiches.listResumes.invalidate({
        collectiviteId,
      });
    },
  });
};
