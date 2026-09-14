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

  return ({ support }: Preuve): void => {
    if (support.type === 'fichier') {
      if (!isPending) {
        downloadDocument(support.fichier.id);
      }
      return;
    }
    if (support.type === 'lien') {
      window.open(support.lien.url, '_blank', 'noopener,noreferrer');
    }
  };
};
