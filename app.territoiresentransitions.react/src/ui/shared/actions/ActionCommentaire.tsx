import {useActions, useAppState} from 'core-logic/overmind';
import React from 'react';
import '../CrossExpandPanel.css';

export const ActionCommentaire = (props: {actionId: string}) => {
  const overmindActions = useActions();
  const overmindState = useAppState();

  const [commentaire, setCommentaire] = React.useState('');

  React.useEffect(() => {
    const commentaireFromState =
      overmindState.actionReferentielCommentaireById[props.actionId] ?? '';
    setCommentaire(commentaireFromState);
  }, [overmindState.actionReferentielCommentaireById[props.actionId]]);

  const onChange = (event: React.FormEvent<HTMLTextAreaElement>) => {
    setCommentaire(event.currentTarget.value);
  };

  const onBlur = () => {
    overmindActions.referentiels.updateActionReferentielCommentaire({
      actionId: props.actionId,
      commentaire: commentaire,
    });
  };

  return (
    <div className={'border-t border-b border-gray-300'}>
      <div className="CrossExpandPanel">
        <details>
          <summary className="title bg-yellow-400">todo Commentaire</summary>
          <textarea
            className="content w-full h-24 min-h-full overflow-scroll"
            value={commentaire} // TODO : fix me ! Ca ne marche pas quand on recharge la page, car le composant est monté avec une valeur par défaut vide, avant qu'il y ait le fetch via l'action fetchAllCommentaireFromApi
            onChange={onChange}
            onBlur={onBlur}
          />
        </details>
      </div>
    </div>
  );
};
