import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {ActionCommentaireField} from 'ui/shared/actions/ActionCommentaire';
import {
  useActionJustification,
  useSaveActionJustification,
} from '../data/useActionJustification';
import {useEffect, useState} from 'react';

type ActionJustificationProps = {
  action: ActionDefinitionSummary;
  className?: string;
  backgroundClassName?: string;
  title?: string;
  subtitle?: string;
  autoFocus?: boolean;
  onSave?: (payload: {
    collectivite_id: number;
    action_id: string;
    texte: string;
    modified_at: string;
  }) => void;
  onChange?: (value: string) => void;
};

const ActionJustification = ({
  action,
  className,
  backgroundClassName,
  title,
  subtitle,
  autoFocus,
  onSave,
  onChange,
}: ActionJustificationProps) => {
  const {actionJustification, isLoading} = useActionJustification(action.id);
  const {saveActionJustification} = useSaveActionJustification();

  const [initialValue, setInitialValue] = useState('');

  useEffect(
    () => setInitialValue(actionJustification?.texte ?? ''),
    [actionJustification?.texte]
  );

  const handleSave = async (payload: {
    action_id: string;
    collectivite_id: number;
    commentaire: string;
    modified_at?: string | undefined;
    modified_by?: string | undefined;
  }) => {
    const savedData = {
      collectivite_id: payload.collectivite_id,
      action_id: payload.action_id,
      texte: payload.commentaire,
      modified_at: new Date().toDateString(),
    };

    await setInitialValue(payload.commentaire);

    if (!!onSave) {
      onSave(savedData);
    } else if (!payload.commentaire.length) {
      // Permet de forcer le contenu du textarea lorsque l'utilisateur
      // supprime le texte et quitte la zone de texte
      setInitialValue(actionJustification?.texte ?? '');
    } else {
      saveActionJustification(savedData);
    }
  };

  return (
    <div className={className}>
      <ActionCommentaireField
        dataTest={`just-${action.id}`}
        backgroundClassName={backgroundClassName}
        action={action}
        initialValue={initialValue}
        title={title}
        subtitle={subtitle}
        autoFocus={autoFocus}
        disabled={isLoading}
        onSave={handleSave}
        onChange={onChange}
      />
    </div>
  );
};

export default ActionJustification;
