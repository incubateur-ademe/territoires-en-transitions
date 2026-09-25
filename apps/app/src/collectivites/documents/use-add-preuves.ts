import {
  QueryClient,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { TRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { AppRouter, useTRPC } from '@tet/api';
import { ReferentielId } from '@tet/domain/referentiels';

export const useAddPreuveReglementaire = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return useMutation(
    trpc.referentiels.actions.addPreuveReglementaire.mutationOptions({
      onSuccess: (_data, variables) => {
        invalidateQueries({
          queryClient,
          collectiviteId: variables.collectiviteId,
          trpc,
        });
      },
    })
  );
};

export const useAddPreuveComplementaire = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return useMutation(
    trpc.referentiels.actions.addPreuveComplementaire.mutationOptions({
      onSuccess: (_data, variables) => {
        invalidateQueries({
          queryClient,
          collectiviteId: variables.collectiviteId,
          trpc,
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
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.referentiels.labellisations.createLabellisationPreuve.mutationOptions({
      onSettled: (_data, _error, variables) => {
        invalidateQueries({ queryClient, collectiviteId, trpc });
        queryClient.invalidateQueries({
          queryKey:
            trpc.referentiels.documents.listDocumentsDemandeLabellisation.queryKey(
              {
                demandeId: variables.demandeId,
              }
            ),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.labellisations.getParcours.queryKey({
            collectiviteId,
            referentielId,
          }),
        });
      },
    })
  );
};

export const useAddPreuveAudit = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return useMutation(
    trpc.referentiels.actions.addPreuveAudit.mutationOptions({
      onSuccess: (_data, variables) => {
        invalidateQueries({
          queryClient,
          collectiviteId: variables.collectiviteId,
          trpc,
        });
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.documents.listDocumentsAudit.queryKey({
            auditId: variables.auditId,
          }),
        });
      },
    })
  );
};

/** Ajoute un rapport de visite annuelle */
export const useAddPreuveRapport = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return useMutation(
    trpc.referentiels.actions.addPreuveRapport.mutationOptions({
      onSuccess: (_data, variables) => {
        invalidateQueries({
          queryClient,
          collectiviteId: variables.collectiviteId,
          trpc,
        });
      },
    })
  );
};

// recharge la liste des preuves
export const invalidateQueries = ({
  queryClient,
  collectiviteId,
  trpc,
}: {
  queryClient: QueryClient;
  collectiviteId: number;
  trpc: TRPCOptionsProxy<AppRouter>;
}): void => {
  queryClient.invalidateQueries({
    queryKey: trpc.referentiels.documents.listDocumentsReferentiel.pathKey(),
  });
  queryClient.invalidateQueries({
    queryKey: trpc.referentiels.documents.listDocumentsMesure.pathKey(),
  });
  queryClient.invalidateQueries({
    queryKey: trpc.referentiels.actions.countPreuves.queryKey({
      collectiviteId,
    }),
  });
};
