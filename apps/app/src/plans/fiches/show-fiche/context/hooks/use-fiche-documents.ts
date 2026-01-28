import { useAnnexesFicheAction } from '../../data/useAnnexesFicheAction';
import { DocumentsState } from '../types';

export const useFicheDocuments = (
  collectiviteId: number,
  ficheId: number
): DocumentsState => {
  const { data: list, isLoading } = useAnnexesFicheAction(
    collectiviteId,
    ficheId
  );

  return {
    list,
    isLoading,
  };
};
