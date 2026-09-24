import {
  QueryClient,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { TRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { AppRouter, useSupabase, useTRPC } from '@tet/api';
import { ReferentielId } from '@tet/domain/referentiels';

// on peut ajouter une preuve sous forme de...
type FileOrLink =
  // ...référence à un fichier de la bibliothèque
  | {
      fichierId: number;
      commentaire: string;
    }
  // ..ou de lien
  | {
      url: string;
      titre: string;
      commentaire: string;
    };

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

/** Ajoute un rapport de visite annuelle */
type AddPreuveRapportArgs = {
  collectiviteId: number;
  date: string;
} & FileOrLink;

const toPreuveRapportRow = (preuve: AddPreuveRapportArgs) => {
  const rapport = {
    collectivite_id: preuve.collectiviteId,
    date: preuve.date,
    commentaire: preuve.commentaire,
  };

  if ('fichierId' in preuve) {
    return { ...rapport, fichier_id: preuve.fichierId };
  }

  return { ...rapport, url: preuve.url, titre: preuve.titre };
};

export const useAddPreuveRapport = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return useMutation({
    mutationFn: async (preuve: AddPreuveRapportArgs) =>
      supabase.from('preuve_rapport').insert(toPreuveRapportRow(preuve)),

    onSuccess: (data, variables) => {
      invalidateQueries({
        queryClient,
        collectiviteId: variables.collectiviteId,
        trpc,
      });
    },
  });
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
