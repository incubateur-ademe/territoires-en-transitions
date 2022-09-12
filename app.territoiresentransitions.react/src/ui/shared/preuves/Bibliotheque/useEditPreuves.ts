import {useState} from 'react';
import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {TPreuve, TEditHandlers} from './types';

type TEditPreuve = (preuve: TPreuve) => TEditHandlers;

/** Renvoie les gestionnaires d'événement nécessaires à l'édition des preuves
 * (édition commentaire & suppression) */
export const useEditPreuves: TEditPreuve = preuve => {
  const [isEditingComment, setEditingComment] = useState(false);
  const {mutate: removePreuve} = useRemovePreuve();
  const {mutate: updateComment} = useUpdatePreuveCommentaire();
  const {commentaire} = preuve;
  const [updatedComment, setUpdatedComment] = useState(commentaire);

  const remove = () => {
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
    {mutationKey: 'remove_preuve'}
  );

// renvoie une fonction de modification du commentaire d'une preuve
const useUpdatePreuveCommentaire = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (preuve: TPreuve) => {
      const {id, commentaire} = preuve;
      return supabaseClient
        .from(tableOfType(preuve))
        .update({commentaire})
        .match({id});
    },
    {
      mutationKey: 'update_preuve_commentaire',
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['preuve', variables.collectivite_id]);
      },
    }
  );
};
