import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import {
  useActionCommentaire,
  useSaveActionCommentaire,
} from '@/app/referentiels/use-action-commentaire';
import { AutoResizedTextarea, Field } from '@/ui';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';

type ActionCommentaireProps = {
  action: ActionDefinitionSummary;
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
  title?: string;
  subtitle?: string;
  onSave?: () => void;
};

export const ActionCommentaire = ({
  action,
  className,
  autoFocus,
  placeholder,
  title,
  subtitle,
  onSave,
}: ActionCommentaireProps) => {
  const { actionCommentaire, isLoading } = useActionCommentaire(action.id);
  const { saveActionCommentaire } = useSaveActionCommentaire();

  // On utilise le `isLoading` pour masquer l'input, car il gère son state.
  return (
    <div className={className}>
      {!isLoading && (
        <ActionCommentaireField
          dataTest={`comm-${action.id}`}
          action={action}
          initialValue={actionCommentaire?.commentaire || ''}
          title={
            title
              ? title
              : action.type !== 'tache'
              ? "Explications sur l'état d'avancement"
              : undefined
          }
          subtitle={subtitle}
          autoFocus={autoFocus}
          onSave={(payload) => {
            saveActionCommentaire(payload);
            onSave && onSave();
          }}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

export type ActionCommentaireFieldProps = {
  dataTest: string;
  action: ActionDefinitionSummary;
  initialValue: string;
  title?: string;
  subtitle?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onSave: (payload: {
    action_id: string;
    collectivite_id: number;
    commentaire: string;
    modified_at?: string | undefined;
    modified_by?: string | undefined;
  }) => void;
  onChange?: (value: string) => void;
};

export const ActionCommentaireField = ({
  dataTest,
  action,
  initialValue,
  title,
  subtitle,
  autoFocus = false,
  disabled = false,
  placeholder,
  onSave,
  onChange,
}: ActionCommentaireFieldProps) => {
  const collectivite = useCurrentCollectivite();
  const [commentaire, setCommentaire] = useState(initialValue);

  useEffect(() => setCommentaire(initialValue), [initialValue]);

  return collectivite ? (
    <Field title={title} hint={subtitle}>
      <AutoResizedTextarea
        dataTest={dataTest}
        className={classNames({ 'min-h-20': action.type !== 'tache' })}
        value={commentaire}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
          setCommentaire(event.currentTarget.value);
          onChange?.(event.currentTarget.value);
        }}
        onBlur={() => {
          commentaire.trim() !== (initialValue || '') &&
            onSave({
              action_id: action.id,
              collectivite_id: collectivite.collectiviteId,
              commentaire: commentaire.trim(),
            });
        }}
        disabled={collectivite.isReadOnly || disabled}
        autoFocus={autoFocus}
        placeholder={placeholder}
      />
    </Field>
  ) : null;
};
