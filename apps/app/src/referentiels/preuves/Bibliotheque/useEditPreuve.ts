import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
    mutate: updateBibliothequeFichierFilename,
    isPending: isUpdateFilenameLoading,
    isError: isUpdateFilenameError,
  } = useUpdateBibliothequeFichierFilename();
  const { commentaire, fichier } = preuve;
  const editComment = useEditState({
    initialValue: commentaire,
    onUpdate: (updatedComment) =>
      updatePreuveCommentaire({ ...preuve, commentaire: updatedComment }),
  });
  const editFilename = useEditFilenameState({
    initialValue: fichier?.filename,
    onUpdate: (updatedFilename) =>
      updateBibliothequeFichierFilename({ ...preuve, updatedFilename }),
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
const tableOfType = ({ preuve_type }: TPreuve) =>
  (preuve_type as string) === 'annexe'
    ? 'annexe'
    : (`preuve_${preuve_type}` as const);

// renvoie une fonction de suppression d'une preuve
const useRemovePreuve = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preuve: TPreuve) => {
      const { id } = preuve;
      return supabase.from(tableOfType(preuve)).delete().match({ id });
    },

    onSuccess: (data, variables) => {
      invalidateQueries(queryClient, variables.collectivite_id, {
        invalidateParcours: false,
      });
    },
  });
};

// renvoie une fonction de modification d'une preuve de type lien
export const useUpdatePreuveLien = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preuve: TPreuve) => {
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

// renvoie une fonction de renommage d'un fichier de la bibliothèque
export const useUpdateBibliothequeFichierFilename = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['update_fiche_bibliotheque_'],
    mutationFn: async (preuve: TPreuve & { updatedFilename: string }) => {
      if (!preuve?.fichier) {
        return null;
      }
      const { collectivite_id, fichier, updatedFilename } = preuve;
      const { hash } = fichier;
      return supabase.rpc('update_bibliotheque_fichier_filename', {
        collectivite_id,
        filename: updatedFilename,
        hash,
      });
    },

    onSuccess: (data, variables) => {
      invalidateQueries(queryClient, variables.collectivite_id, {
        invalidateParcours: false,
      });
    },
  });
};

// renvoie une fonction d'édition de l'option "confidentiel" d'un fichier
export const useUpdateBibliothequeFichierConfidentiel = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preuve: {
      collectivite_id: number;
      fichier: { hash: string };
      updatedConfidentiel: boolean;
    }) => {
      if (!preuve?.fichier) {
        return null;
      }
      const { collectivite_id, fichier, updatedConfidentiel } = preuve;
      const { hash } = fichier;
      return supabase.rpc('update_bibliotheque_fichier_confidentiel', {
        collectivite_id,
        confidentiel: updatedConfidentiel,
        hash,
      });
    },

    onSuccess: (data, variables) => {
      invalidateQueries(queryClient, variables.collectivite_id, {
        invalidateParcours: false,
      });
    },
  });
};
