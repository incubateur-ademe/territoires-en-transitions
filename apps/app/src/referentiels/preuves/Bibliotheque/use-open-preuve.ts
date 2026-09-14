import { useDownloadDocument } from '../data/use-download-document';
import { Preuve } from './types';

export const useOpenPreuve = ({
  collectiviteId,
}: {
  collectiviteId: number;
}): ((preuve: Preuve) => void) => {
  const { mutate: downloadDocument, isPending } = useDownloadDocument({
    collectiviteId,
  });

  return (preuve: Preuve): void => {
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
