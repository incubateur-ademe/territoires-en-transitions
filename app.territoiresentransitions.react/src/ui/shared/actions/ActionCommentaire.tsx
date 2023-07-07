import '../CrossExpandPanel.css';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import Textarea from 'ui/shared/form/Textarea';
import {
  useActionCommentaire,
  useSaveActionCommentaire,
} from 'core-logic/hooks/useActionCommentaire';
import React, {useEffect, useState} from 'react';
import classNames from 'classnames';

type ActionCommentaireProps = {
  action: ActionDefinitionSummary;
  className?: string;
  backgroundClassName?: string;
  autoFocus?: boolean;
  onSave?: () => void;
};

export const ActionCommentaire = ({
  action,
  className,
  backgroundClassName,
  autoFocus,
  onSave,
}: ActionCommentaireProps) => {
  const {actionCommentaire, isLoading} = useActionCommentaire(action.id);

  // On utilise le `isLoading` pour masquer l'input, car il gère son state.
  return (
    <div className={className}>
      {!isLoading && (
        <ActionCommentaireField
          backgroundClassName={backgroundClassName}
          action={action}
          initialValue={actionCommentaire?.commentaire || ''}
          autoFocus={autoFocus}
          onSave={onSave}
        />
      )}
    </div>
  );
};

export type ActionCommentaireFieldProps = {
  backgroundClassName?: string;
  action: ActionDefinitionSummary;
  initialValue: string;
  autoFocus?: boolean;
  onSave?: () => void;
};

export const ActionCommentaireField = ({
  backgroundClassName,
  action,
  initialValue,
  autoFocus = false,
  onSave,
}: ActionCommentaireFieldProps) => {
  const collectivite = useCurrentCollectivite();
  const {saveActionCommentaire} = useSaveActionCommentaire();
  const [commentaire, setCommentaire] = useState(initialValue);

  useEffect(() => setCommentaire(initialValue), [initialValue]);

  return collectivite ? (
    <>
      {action.type !== 'tache' && (
        <p className="text-neutral-900 !mb-2">
          Explications sur l'état d'avancement
        </p>
      )}
      <Textarea
        data-test={`comm-${action.id}`}
        className={classNames('fr-input !outline-none', backgroundClassName, {
          '!bg-[#f6f6f6]': !backgroundClassName,
        })}
        minHeight={action.type === 'tache' ? undefined : '5rem'}
        value={commentaire}
        onInputChange={() => null}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
          setCommentaire(event.currentTarget.value)
        }
        onBlur={() => {
          commentaire.trim() !== (initialValue || '') &&
            saveActionCommentaire({
              action_id: action.id,
              collectivite_id: collectivite.collectivite_id,
              commentaire: commentaire.trim(),
            });
          onSave && onSave();
        }}
        disabled={collectivite.readonly}
        autoFocus={autoFocus}
      />
    </>
  ) : null;
};
