import { toDemandeTarget } from '@/app/collectivites/documents/to-document-target';
import { useInvalidateDocuments } from '@/app/collectivites/documents/use-invalidate-documents';
import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useReferentielId } from '../referentiel-context';
import { useCycleLabellisation } from './useCycleLabellisation';

export const useRemovePreuveFromDemande = (): {
  removePreuve: (preuveId: number) => void;
} => {
  const referentielId = useReferentielId();
  const trpc = useTRPC();
  const invalidateDocuments = useInvalidateDocuments();
  const { parcours } = useCycleLabellisation(referentielId);
  const { setToast } = useToastContext();

  const demande = parcours?.demande ?? null;

  const invalidateDemandeDocuments = async (): Promise<void> => {
    if (demande === null) {
      return;
    }
    await invalidateDocuments(toDemandeTarget(demande));
  };

  const { mutate } = useMutation(
    trpc.collectivites.documents.removePreuve.mutationOptions({
      onSuccess: invalidateDemandeDocuments,
      onError: () => setToast('error', appLabels.mutationError),
    })
  );

  const removePreuve = (preuveId: number): void => {
    if (demande === null) {
      setToast('error', appLabels.acteEngagementNoDemandeError);
      return;
    }
    mutate({ preuveId, preuveType: 'labellisation' });
  };

  return { removePreuve };
};
