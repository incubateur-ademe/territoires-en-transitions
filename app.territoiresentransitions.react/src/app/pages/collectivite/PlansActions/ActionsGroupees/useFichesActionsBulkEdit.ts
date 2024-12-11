import { trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useQueryClient } from 'react-query';

export const useFichesActionsBulkEdit = () => {
  // TODO: utiliser invalidate de trpc.useUtils()
  const collectiviteId = useCollectiviteId()!;
  const queryClient = useQueryClient();

  const onMutationSuccess = () => {
    queryClient.invalidateQueries([
      'fiches_resume_collectivite',
      collectiviteId,
    ]);
  };

  return trpc.plans.fiches.bulkEdit.useMutation({
    onSuccess() {
      onMutationSuccess();
    },
  });
};
