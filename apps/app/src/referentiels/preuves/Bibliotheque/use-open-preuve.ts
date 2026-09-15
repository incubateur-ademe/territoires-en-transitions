import { useDownloadDocument } from '../data/use-download-document';
import { DocumentRattache } from './types';

export const useOpenPreuve = ({
  collectiviteId,
}: {
  collectiviteId: number;
}): ((preuve: DocumentRattache) => void) => {
  const { mutate: downloadDocument, isPending } = useDownloadDocument({
    collectiviteId,
  });

  return (preuve: DocumentRattache): void => {
    if (preuve.type === 'fichier') {
      if (!isPending) {
        downloadDocument(preuve.fichier.id);
      }
      return;
    }
    if (preuve.type === 'lien') {
      window.open(preuve.lien.url, '_blank', 'noopener,noreferrer');
    }
  };
};
