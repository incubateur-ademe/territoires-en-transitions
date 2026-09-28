import { useQuery } from '@tanstack/react-query';
import { useTRPCClient } from '@tet/api';

/**
 * Contenu d'un fichier de la bibliothèque de la collectivité, pour le remettre
 * à un formulaire comme si l'utilisateur l'avait choisi lui-même.
 */
export const useGetDocumentFile = ({
  collectiviteId,
  fichierId,
}: {
  collectiviteId: number;
  fichierId: number | undefined;
}) => {
  const trpcClient = useTRPCClient();

  return useQuery({
    queryKey: ['collectivite-document-file', collectiviteId, fichierId],
    queryFn: async (): Promise<File> => {
      if (fichierId === undefined) {
        throw new Error('fichierId manquant');
      }
      const document =
        await trpcClient.collectivites.documents.getDownloadUrl.mutate({
          collectiviteId,
          fichierId,
        });
      const response = await fetch(document.signedUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      return new File([blob], document.filename, { type: blob.type });
    },
    enabled: fichierId !== undefined,
    // L'URL signée expire, pas le contenu : inutile de le retélécharger à
    // chaque ouverture de la modale.
    staleTime: Infinity,
    retry: false,
  });
};
