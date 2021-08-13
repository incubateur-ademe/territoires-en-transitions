import { useActions, useAppState } from "core-logic/overmind";
import React from "react";
import "../CrossExpandPanel.css";

export const ActionCommentaire = (props: { actionId: string }) => {
  const overmindActions = useActions();
  const overmindState = useAppState();

  const [commentaire, setCommentaire] = React.useState("");

  React.useEffect(() => {
    const commentaireFromState =
      overmindState.actionReferentielCommentaireById[props.actionId] ?? "";
    setCommentaire(commentaireFromState);
  }, [useAppState().actionReferentielCommentaireById]);

  const onBlur = (event: React.FormEvent<HTMLTextAreaElement>) => {
    overmindActions.updateActionReferentielCommentaire({
      actionId: props.actionId,
      commentaire: event.currentTarget.value,
    });
  };
  return (
    <div className={`border-t border-b border-gray-300`}>
      <div className="CrossExpandPanel">
        <details>
          <summary className="title">Commentaire</summary>
          <textarea
            className="content w-full h-24 min-h-full overflow-scroll"
            defaultValue={commentaire} // TODO : fix me ! Ca ne marche pas quand on recharge la page, car le composant est monté avec une valeur par défaut vide, avant qu'il y ait le fetch via l'action fetchAllCommentaireFromApi
            onBlur={onBlur}
          />
        </details>
      </div>
    </div>
  );
};
