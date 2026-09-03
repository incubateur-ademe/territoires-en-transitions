import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC, useTRPCClient } from '@tet/api';
import { invalidateQueries } from '../useAddPreuves';
import { EditHandlers, Preuve } from './types';
import { useEditFilenameState, useEditState } from './useEditState';

type EditPreuve = (preuve: Preuve) => EditHandlers;

/** Renvoie les gestionnaires d'événement nécessaires à l'édition des preuves
 * (édition commentaire & suppression) */
export const useEditPreuve: EditPreuve = (preuve) => {
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
        collectiviteId: preuve.collectiviteId,
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
    mutationFn: async (preuve: Preuve) => {
      const { id } = preuve;
      return trpcClient.collectivites.documents.removePreuve.mutate({
        preuveId: id,
        preuveType: preuve.preuveType,
      });
    },

    onSuccess: (_data, variables) => {
      invalidateQueries(queryClient, variables.collectiviteId, {
        invalidateParcours: false,
        trpc,
      });
      if (variables.preuveType === 'annexe') {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.ficheAnnexes.pathKey(),
        });
      }

      queryClient.invalidateQueries({
        queryKey: trpc.referentiels.documents.listDocumentsAudit.queryKey(
          {}
        ),
      });

      const demande = 'demande' in variables ? variables.demande : null;
      if (demande) {
        queryClient.invalidateQueries({
          queryKey:
            trpc.referentiels.documents.listDocumentsDemandeLabellisation.queryKey({
              demandeId: demande.id,
            }),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.labellisations.getParcours.queryKey({
            collectiviteId: demande.collectiviteId,
            referentielId: demande.referentiel,
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
      preuve: Pick<Preuve, 'id' | 'lien' | 'collectiviteId' | 'preuveType'>
    ) => {
      const { id, lien } = preuve;
      if (!lien) return;
      return trpcClient.collectivites.documents.updatePreuve.mutate({
        preuveId: id,
        preuveType: preuve.preuveType,
        lien,
      });
    },

    onSuccess: (_data, variables) => {
      invalidateQueries(queryClient, variables.collectiviteId, {
        invalidateParcours: false,
        trpc,
      });
      if (variables.preuveType === 'annexe') {
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
        Preuve,
        'id' | 'commentaire' | 'collectiviteId' | 'preuveType'
      >
    ) => {
      const { id, commentaire } = preuve;
      return trpcClient.collectivites.documents.updatePreuve.mutate({
        preuveId: id,
        preuveType: preuve.preuveType,
        commentaire: commentaire ?? '',
      });
    },

    onSuccess: (data, variables) => {
      invalidateQueries(queryClient, variables.collectiviteId, {
        invalidateParcours: false,
        trpc,
      });
      if (variables.preuveType === 'annexe') {
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
        queryClient.invalidateQueries({
          queryKey:
            trpc.referentiels.documents.listDocumentsDemandeLabellisation.pathKey(),
        });
      },
    })
  );
};
