import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC, useTRPCClient } from '@tet/api';
import { invalidateQueries } from '../useAddPreuves';
import { TEditHandlers, TPreuve } from './types';
import { useEditFilenameState, useEditState } from './useEditState';

type TEditPreuve = (preuve: TPreuve) => TEditHandlers;

/** Renvoie les gestionnaires d'événement nécessaires à l'édition des preuves
 * (édition commentaire & suppression) */
export const useEditPreuve: TEditPreuve = (preuve) => {
  const {
    mutate: removePreuve,
    isPending: isRemovePreuveLoading,
    isError: isRemovePreuveError,
  } = useRemovePreuve();
  const {
    mutate: updatePreuveCommentaire,
    isPending: isUpdateCommentaireLoadind,
    isError: isUpdateCommentaireError,
  } = useUpdatePreuveCommentaire();
  const {
    mutate: updateBibliothequeFichier,
    isPending: isUpdateFilenameLoading,
    isError: isUpdateFilenameError,
  } = useUpdateBibliothequeFichier();
  const { commentaire, fichier } = preuve;
  const editComment = useEditState({
    initialValue: commentaire,
    onUpdate: (updatedComment) =>
      updatePreuveCommentaire({ ...preuve, commentaire: updatedComment }),
  });
  const editFilename = useEditFilenameState({
    initialValue: fichier?.filename,
    onUpdate: (updatedFilename) => {
      if (!preuve.fichier) {
        return;
      }
      updateBibliothequeFichier({
        collectiviteId: preuve.collectivite_id,
        hash: preuve.fichier.hash,
        filename: updatedFilename,
      });
    },
  });

  const remove = () => {
    removePreuve(preuve);
  };

  return {
    remove,
    editComment,
    editFilename,
    isLoading:
      isRemovePreuveLoading ||
      isUpdateCommentaireLoadind ||
      isUpdateFilenameLoading,
    isError:
      isRemovePreuveError || isUpdateCommentaireError || isUpdateFilenameError,
  };
};

// renvoie une fonction de suppression d'une preuve
export const useRemovePreuve = () => {
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return useMutation({
    mutationFn: async (preuve: TPreuve) => {
      const { id } = preuve;
      return trpcClient.collectivites.documents.removePreuve.mutate({
        preuveId: id,
        preuveType: preuve.preuve_type,
      });
    },

    onSuccess: (_data, variables) => {
      invalidateQueries(queryClient, variables.collectivite_id, {
        invalidateParcours: false,
        trpc,
      });
      if (variables.preuve_type === 'annexe') {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.ficheAnnexes.pathKey(),
        });
      }

      queryClient.invalidateQueries({
        queryKey: trpc.referentiels.labellisations.listPreuvesAudit.queryKey(
          {}
        ),
      });

      if (variables.demande?.id) {
        queryClient.invalidateQueries({
          queryKey:
            trpc.referentiels.labellisations.listPreuvesLabellisation.queryKey({
              demandeId: variables.demande.id,
            }),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.labellisations.getParcours.queryKey({
            collectiviteId: variables.demande.collectivite_id,
            referentielId: variables.demande.referentiel,
          }),
        });
      }
    },
  });
};

// renvoie une fonction de modification d'une preuve de type lien
export const useUpdatePreuveLien = () => {
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return useMutation({
    mutationFn: async (
      preuve: Pick<TPreuve, 'id' | 'lien' | 'collectivite_id' | 'preuve_type'>
    ) => {
      const { id, lien } = preuve;
      if (!lien) return;
      return trpcClient.collectivites.documents.updatePreuve.mutate({
        preuveId: id,
        preuveType: preuve.preuve_type,
        lien,
      });
    },

    onSuccess: (_data, variables) => {
      invalidateQueries(queryClient, variables.collectivite_id, {
        invalidateParcours: false,
        trpc,
      });
      if (variables.preuve_type === 'annexe') {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.ficheAnnexes.pathKey(),
        });
      }
    },
  });
};

// renvoie une fonction de modification du commentaire d'une preuve
const useUpdatePreuveCommentaire = () => {
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return useMutation({
    mutationFn: async (
      preuve: Pick<
        TPreuve,
        'id' | 'commentaire' | 'collectivite_id' | 'preuve_type'
      >
    ) => {
      const { id, commentaire } = preuve;
      return trpcClient.collectivites.documents.updatePreuve.mutate({
        preuveId: id,
        preuveType: preuve.preuve_type,
        commentaire: commentaire ?? '',
      });
    },

    onSuccess: (data, variables) => {
      invalidateQueries(queryClient, variables.collectivite_id, {
        invalidateParcours: false,
        trpc,
      });
      if (variables.preuve_type === 'annexe') {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.ficheAnnexes.pathKey(),
        });
      }
    },
  });
};

// renvoie une fonction de mise à jour d'un fichier de la bibliothèque (nom et/ou confidentiel)
export const useUpdateBibliothequeFichier = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return useMutation(
    trpc.collectivites.documents.update.mutationOptions({
      onSuccess: (_data, variables) => {
        invalidateQueries(queryClient, variables.collectiviteId, {
          invalidateParcours: false,
          trpc,
        });
        queryClient.invalidateQueries({
          queryKey: ['bibliotheque_fichier'],
        });
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.ficheAnnexes.pathKey(),
        });
      },
    })
  );
};
