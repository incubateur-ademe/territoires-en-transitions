import {useState} from 'react';
import {useMutation} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {TPreuve, TEditHandlers} from './types';
import {useRefetchPreuves} from './useAddPreuves';

type TEditPreuve = (preuve: TPreuve) => TEditHandlers;

/** Renvoie les gestionnaires d'événement nécessaires à l'édition des preuves
 * (édition commentaire & suppression) */
export const useEditPreuve: TEditPreuve = preuve => {
  const [isEditingComment, setEditingComment] = useState(false);
  const {mutate: removePreuve} = useRemovePreuve();
  const {mutate: updateComment} = useUpdatePreuveCommentaire();
  const {commentaire} = preuve;
  const [updatedComment, setUpdatedComment] = useState(commentaire);

  const remove = () => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Voulez-vous vraiment supprimer cette preuve ?')) {
      removePreuve(preuve);
    }
  };

  const update = () => {
    setEditingComment(false);
    updateComment({...preuve, commentaire: updatedComment});
  };

  return {
    remove,
    update,
    isEditingComment,
    setEditingComment,
    updatedComment,
    setUpdatedComment,
  };
};

// le nom de la table dans laquelle sont stockées les infos sur une preuve
// dépend du type de la preuve
const tableOfType = ({preuve_type}: TPreuve) => `preuve_${preuve_type}`;

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
        .update({commentaire})
        .match({id});
    },
    {
      mutationKey: 'update_preuve_commentaire',
      onSuccess: useRefetchPreuves(),
    }
  );
