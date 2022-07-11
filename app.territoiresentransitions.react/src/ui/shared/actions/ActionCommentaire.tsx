import '../CrossExpandPanel.css';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {AutoTextArea} from '../AutoTextArea';
import {
  useActionCommentaire,
  useSaveActionCommentaire,
} from '../../../core-logic/hooks/useActionCommentaire';
import {useState} from 'react';

export const ActionCommentaire = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const data = useActionCommentaire(action.id);

  return (
    <div className="border-gray-300 my-3">
      <ActionCommentaireField action={action} value={data?.commentaire || ''} />
    </div>
  );
};

export type ActionCommentaireFieldProps = {
  action: ActionDefinitionSummary;
  value: string;
};

export const ActionCommentaireField = ({
  action,
  value,
}: ActionCommentaireFieldProps) => {
  const collectivite = useCurrentCollectivite();
  const {saveActionCommentaire} = useSaveActionCommentaire();
  const [commentaire, setCommentaire] = useState(value);

  return collectivite ? (
    <AutoTextArea
      value={commentaire}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
        setCommentaire(event.currentTarget.value)
      }
      onBlur={() =>
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
