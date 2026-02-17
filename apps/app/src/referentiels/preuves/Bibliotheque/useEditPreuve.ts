import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase, useTRPC } from '@tet/api';
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

// le nom de la table dans laquelle sont stockées les infos sur une preuve
// dépend du type de la preuve
const tableOfType = ({ preuve_type }: Pick<TPreuve, 'preuve_type'>) =>
  (preuve_type as string) === 'annexe'
    ? 'annexe'
    : (`preuve_${preuve_type}` as const);

// renvoie une fonction de suppression d'une preuve
const useRemovePreuve = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return useMutation({
    mutationFn: async (preuve: TPreuve) => {
      const { id } = preuve;
      return supabase.from(tableOfType(preuve)).delete().match({ id });
    },

    onSuccess: (data, variables) => {
      invalidateQueries(queryClient, variables.collectivite_id, {
        invalidateParcours: false,
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
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      preuve: Pick<TPreuve, 'id' | 'lien' | 'collectivite_id' | 'preuve_type'>
    ) => {
      const { id, lien } = preuve;
      if (!lien) return;
      const { url, titre } = lien;
      return supabase
        .from(tableOfType(preuve))
        .update({ url, titre })
        .match({ id });
    },

    onSuccess: (data, variables) => {
      invalidateQueries(queryClient, variables.collectivite_id, {
        invalidateParcours: false,
      });
    },
  });
};

// renvoie une fonction de modification du commentaire d'une preuve
const useUpdatePreuveCommentaire = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preuve: TPreuve) => {
      const { id, commentaire } = preuve;
      return supabase
        .from(tableOfType(preuve))
        .update({ commentaire: commentaire || '' })
        .match({ id });
    },

    onSuccess: (data, variables) => {
      invalidateQueries(queryClient, variables.collectivite_id, {
        invalidateParcours: false,
      });
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
        });
        queryClient.invalidateQueries({
          queryKey: ['bibliotheque_fichier'],
        });
      },
    })
  );
};
