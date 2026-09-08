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
    const { fichier, lien } = preuve;
    if (fichier) {
      if (!isPending) {
        downloadDocument(fichier.id);
      }
      return;
    }
    if (lien) {
      window.open(lien.url, '_blank', 'noopener,noreferrer');
    }
  };
};
