import { supabaseClient } from '@/app/core-logic/api/supabase';
import {
  useEditFilenameState,
  useEditState,
} from '@/app/core-logic/hooks/useEditState';
import { useMutation } from 'react-query';
import { useRefetchPreuves } from '../useAddPreuves';
import { TEditHandlers, TPreuve } from './types';

type TEditPreuve = (preuve: TPreuve) => TEditHandlers;

/** Renvoie les gestionnaires d'événement nécessaires à l'édition des preuves
 * (édition commentaire & suppression) */
export const useEditPreuve: TEditPreuve = (preuve) => {
  const {
    mutate: removePreuve,
    isLoading: isRemovePreuveLoading,
    isError: isRemovePreuveError,
  } = useRemovePreuve();
  const {
    mutate: updatePreuveCommentaire,
    isLoading: isUpdateCommentaireLoadind,
    isError: isUpdateCommentaireError,
  } = useUpdatePreuveCommentaire();
  const {
    mutate: updateBibliothequeFichierFilename,
    isLoading: isUpdateFilenameLoading,
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
const useRemovePreuve = () =>
  useMutation(
    async (preuve: TPreuve) => {
      const { id } = preuve;
      return supabaseClient.from(tableOfType(preuve)).delete().match({ id });
    },
    {
      mutationKey: 'remove_preuve',
      onSuccess: useRefetchPreuves(),
    }
  );

// renvoie une fonction de modification d'une preuve de type lien
export const useUpdatePreuveLien = () =>
  useMutation(
    async (preuve: TPreuve) => {
      const { id, lien } = preuve;
      if (!lien) return;
      const { url, titre } = lien;
      return supabaseClient
        .from(tableOfType(preuve))
        .update({ url, titre })
        .match({ id });
    },
    {
      mutationKey: 'update_preuve_lien',
      onSuccess: useRefetchPreuves(),
    }
  );

// renvoie une fonction de modification du commentaire d'une preuve
const useUpdatePreuveCommentaire = () =>
  useMutation(
    async (preuve: TPreuve) => {
      const { id, commentaire } = preuve;
      return supabaseClient
        .from(tableOfType(preuve))
        .update({ commentaire: commentaire || '' })
        .match({ id });
    },
    {
      mutationKey: 'update_preuve_commentaire',
      onSuccess: useRefetchPreuves(),
    }
  );

// renvoie une fonction de renommage d'un fichier de la bibliothèque
export const useUpdateBibliothequeFichierFilename = () =>
  useMutation(
    async (preuve: TPreuve & { updatedFilename: string }) => {
      if (!preuve?.fichier) {
        return null;
      }
      const { collectivite_id, fichier, updatedFilename } = preuve;
      const { hash } = fichier;
      return supabaseClient.rpc('update_bibliotheque_fichier_filename', {
        collectivite_id,
        filename: updatedFilename,
        hash,
      });
    },
    {
      mutationKey: 'update_bibliotheque_fichier_filename',
      onSuccess: useRefetchPreuves(),
    }
  );

// renvoie une fonction d'édition de l'option "confidentiel" d'un fichier
export const useUpdateBibliothequeFichierConfidentiel = () =>
  useMutation(
    async (preuve: {
      collectivite_id: number;
      fichier: { hash: string };
      updatedConfidentiel: boolean;
    }) => {
      if (!preuve?.fichier) {
        return null;
      }
      const { collectivite_id, fichier, updatedConfidentiel } = preuve;
      const { hash } = fichier;
      return supabaseClient.rpc('update_bibliotheque_fichier_confidentiel', {
        collectivite_id,
        confidentiel: updatedConfidentiel,
        hash,
      });
    },
    {
      mutationKey: 'update_bibliotheque_fichier_confidentiel',
      onSuccess: useRefetchPreuves(),
    }
  );
