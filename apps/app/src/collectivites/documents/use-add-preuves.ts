import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { ReferentielId } from '@tet/domain/referentiels';
import { useInvalidateDocuments } from './use-invalidate-documents';

export const useAddPreuveReglementaire = () => {
  const trpc = useTRPC();
  const invalidateDocuments = useInvalidateDocuments();
  return useMutation(
    trpc.referentiels.actions.addPreuveReglementaire.mutationOptions({
      onSuccess: (_data, variables) => {
        void invalidateDocuments({
          type: 'preuveReglementaire',
          collectiviteId: variables.collectiviteId,
        });
      },
    })
  );
};

export const useAddPreuveComplementaire = () => {
  const trpc = useTRPC();
  const invalidateDocuments = useInvalidateDocuments();
  return useMutation(
    trpc.referentiels.actions.addPreuveComplementaire.mutationOptions({
      onSuccess: (_data, variables) => {
        void invalidateDocuments({
          type: 'mesure',
          collectiviteId: variables.collectiviteId,
        });
      },
    })
  );
};

/** Ajoute une preuve à une demande de labellisation */
export const useAddPreuveLabellisation = (
  collectiviteId: number,
  referentielId: ReferentielId
) => {
  const trpc = useTRPC();
  const invalidateDocuments = useInvalidateDocuments();

  return useMutation(
    trpc.referentiels.labellisations.createLabellisationPreuve.mutationOptions({
      onSettled: (_data, _error, variables) => {
        void invalidateDocuments({
          type: 'demandeLabellisation',
          collectiviteId,
          demandeId: variables.demandeId,
          referentielId,
        });
      },
    })
  );
};
