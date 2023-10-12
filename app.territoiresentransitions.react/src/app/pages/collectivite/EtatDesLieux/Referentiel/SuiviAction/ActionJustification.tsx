import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {ActionCommentaireField} from 'ui/shared/actions/ActionCommentaire';
import {
  useActionJustification,
  useSaveActionJustification,
} from '../data/useActionJustification';

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
};

const ActionJustification = ({
  action,
  className,
  backgroundClassName,
  title,
  subtitle,
  autoFocus,
  onSave,
}: ActionJustificationProps) => {
  const {actionJustification, isLoading} = useActionJustification(action.id);
  const {saveActionJustification} = useSaveActionJustification();

  return (
    <div className={className}>
      <ActionCommentaireField
        dataTest={`just-${action.id}`}
        backgroundClassName={backgroundClassName}
        action={action}
        initialValue={actionJustification?.texte ?? ''}
        title={title}
        subtitle={subtitle}
        autoFocus={autoFocus}
        disabled={isLoading}
        onSave={payload => {
          const savedData = {
            collectivite_id: payload.collectivite_id,
            action_id: payload.action_id,
            texte: payload.commentaire,
            modified_at: new Date().toLocaleDateString(),
          };
          onSave ? onSave(savedData) : saveActionJustification(savedData);
        }}
      />
    </div>
  );
};

export default ActionJustification;
