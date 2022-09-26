import '../CrossExpandPanel.css';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {AutoTextArea} from '../AutoTextArea';
import {
  useActionCommentaire,
  useSaveActionCommentaire,
} from 'core-logic/hooks/useActionCommentaire';
import React, {useState} from 'react';

export const ActionCommentaire = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const {actionCommentaire, isLoading} = useActionCommentaire(action.id);

  // On utilise le `isLoading` pour masquer l'input, car il gère son state.
  return (
    <div className="border-gray-300 my-3">
      {!isLoading && (
        <ActionCommentaireField
          action={action}
          initialValue={actionCommentaire?.commentaire || ''}
        />
      )}
    </div>
  );
};

export type ActionCommentaireFieldProps = {
  action: ActionDefinitionSummary;
  initialValue: string;
};

export const ActionCommentaireField = ({
  action,
  initialValue,
}: ActionCommentaireFieldProps) => {
  const collectivite = useCurrentCollectivite();
  const {saveActionCommentaire} = useSaveActionCommentaire();
  const [commentaire, setCommentaire] = useState(initialValue);

  return collectivite ? (
    <AutoTextArea
      data-test={`comm-${action.id}`}
      value={commentaire}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
        setCommentaire(event.currentTarget.value)
      }
      onBlur={() =>
        commentaire.trim() !== (initialValue || '') &&
        saveActionCommentaire({
          action_id: action.id,
          collectivite_id: collectivite.collectivite_id,
          commentaire,
        })
      }
      hint={
        action.type === 'action'
          ? "Description générale de l'état d'avancement"
          : "Précisions sur l'état d'avancement"
      }
      disabled={collectivite.readonly}
    />
  ) : null;
};
