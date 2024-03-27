import {useMutation} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {
  useEditFilenameState,
  useEditState,
} from 'core-logic/hooks/useEditState';
import {useRefetchPreuves} from './useAddPreuves';
import {TPreuve, TEditHandlers} from './types';

type TEditPreuve = (preuve: TPreuve) => TEditHandlers;

/** Renvoie les gestionnaires d'événement nécessaires à l'édition des preuves
 * (édition commentaire & suppression) */
export const useEditPreuve: TEditPreuve = preuve => {
  const {mutate: removePreuve} = useRemovePreuve();
  const {mutate: updatePreuveCommentaire} = useUpdatePreuveCommentaire();
  const {mutate: updateBibliothequeFichierFilename} =
    useUpdateBibliothequeFichierFilename();
  const {commentaire, fichier} = preuve;
  const editComment = useEditState({
    initialValue: commentaire,
    onUpdate: updatedComment =>
      updatePreuveCommentaire({...preuve, commentaire: updatedComment}),
  });
  const editFilename = useEditFilenameState({
    initialValue: fichier?.filename,
    onUpdate: updatedFilename =>
      updateBibliothequeFichierFilename({...preuve, updatedFilename}),
  });

  const remove = () => {
    removePreuve(preuve);
  };

  return {
    remove,
    editComment,
    editFilename,
  };
};

// le nom de la table dans laquelle sont stockées les infos sur une preuve
// dépend du type de la preuve
const tableOfType = ({preuve_type}: TPreuve) =>
  (preuve_type as string) === 'annexe'
    ? 'annexe'
    : (`preuve_${preuve_type}` as const);

// renvoie une fonction de suppression d'une preuve
const useRemovePreuve = () =>
  useMutation(
    async (preuve: TPreuve) => {
      const {id} = preuve;
      return supabaseClient.from(tableOfType(preuve)).delete().match({id});
    },
    {
      mutationKey: 'remove_preuve',
      onSuccess: useRefetchPreuves(),
    }
  );

// renvoie une fonction de modification du commentaire d'une preuve
const useUpdatePreuveCommentaire = () =>
  useMutation(
    async (preuve: TPreuve) => {
      const {id, commentaire} = preuve;
      return supabaseClient
        .from(tableOfType(preuve))
        .update({commentaire: commentaire || ''})
        .match({id});
    },
    {
      mutationKey: 'update_preuve_commentaire',
      onSuccess: useRefetchPreuves(),
    }
  );

// renvoie une fonction de renommage d'un fichier de la bibliothèque
const useUpdateBibliothequeFichierFilename = () =>
  useMutation(
    async (preuve: TPreuve & {updatedFilename: string}) => {
      if (!preuve?.fichier) {
        return null;
      }
      const {collectivite_id, fichier, updatedFilename} = preuve;
      const {hash} = fichier;
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
