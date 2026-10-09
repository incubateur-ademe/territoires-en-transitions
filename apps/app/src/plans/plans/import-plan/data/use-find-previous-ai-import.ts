import { hashFile } from '@/app/collectivites/documents/upload/hash-file.utils';
import { skipToken, useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export type PreviousAiImport = NonNullable<
  RouterOutput['plans']['aiImport']['findPreviousAiImport']
>;

/**
 * Plan encore présent issu d'un import antérieur du même fichier dans la
 * collectivité. Le fichier est reconnu à son contenu (hash), ou désigné par sa
 * ligne de bibliothèque quand on la connaît déjà.
 */
export const useFindPreviousAiImport = ({
  file,
  fichierId,
}: {
  file?: File;
  fichierId?: number;
}): { previousImport: PreviousAiImport | null; isLoading: boolean } => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  const { data: hash, isLoading: isHashing } = useQuery({
    queryKey: ['file-hash', file?.name, file?.size, file?.lastModified],
    queryFn: () => (file ? hashFile(file) : null),
    enabled: file !== undefined,
    staleTime: Infinity,
  });

  const input =
    fichierId !== undefined
      ? { collectiviteId, fichierId }
      : hash
      ? { collectiviteId, hash }
      : null;
  const { data, isLoading: isFinding } = useQuery(
    trpc.plans.aiImport.findPreviousAiImport.queryOptions(input ?? skipToken, {
      staleTime: 0,
    })
  );

  return {
    previousImport: input !== null ? data ?? null : null,
    isLoading:
      (file !== undefined && isHashing) || (input !== null && isFinding),
  };
};
