import { type UseMutationResult } from '@tanstack/react-query';
import { RouterInput, useTRPCClient } from '@tet/api';
import { useDownloadSignedFile } from '@/app/utils/use-download-signed-file';

export type BibliothequeFichierRef =
  RouterInput['collectivites']['documents']['getDownloadUrl'];

export const useDownloadDocument = (): UseMutationResult<
  void,
  Error,
  BibliothequeFichierRef
> => {
  const trpcClient = useTRPCClient();

  return useDownloadSignedFile(async (input: BibliothequeFichierRef) => {
    const { signedUrl, filename } =
      await trpcClient.collectivites.documents.getDownloadUrl.mutate(input);
    return { url: signedUrl, filename };
  });
};
