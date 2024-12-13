import { ActionDefinitionSummary } from '@/app/core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {
  useActionCommentaire,
  useSaveActionCommentaire,
} from '@/app/core-logic/hooks/useActionCommentaire';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import Textarea from '@/app/ui/shared/form/Textarea';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';

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
  const { actionCommentaire, isLoading } = useActionCommentaire(action.id);
  const { saveActionCommentaire } = useSaveActionCommentaire();

  // On utilise le `isLoading` pour masquer l'input, car il gère son state.
  return (
    <div className={className}>
      {!isLoading && (
        <ActionCommentaireField
          dataTest={`comm-${action.id}`}
          backgroundClassName={backgroundClassName}
          action={action}
          initialValue={actionCommentaire?.commentaire || ''}
          title={
            action.type !== 'tache'
              ? "Explications sur l'état d'avancement"
              : undefined
          }
          autoFocus={autoFocus}
          onSave={(payload) => {
            saveActionCommentaire(payload);
            onSave && onSave();
          }}
        />
      )}
    </div>
  );
};

export type ActionCommentaireFieldProps = {
  dataTest: string;
  backgroundClassName?: string;
  action: ActionDefinitionSummary;
  initialValue: string;
  title?: string;
  subtitle?: string;
  autoFocus?: boolean;
  disabled?: boolean;
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
  backgroundClassName,
  action,
  initialValue,
  title,
  subtitle,
  autoFocus = false,
  disabled = false,
  onSave,
  onChange,
}: ActionCommentaireFieldProps) => {
  const collectivite = useCurrentCollectivite();
  const [commentaire, setCommentaire] = useState(initialValue);

  useEffect(() => setCommentaire(initialValue), [initialValue]);

  return collectivite ? (
    <>
      {!!title && <p className="text-neutral-900 !mb-2">{title}</p>}
      {!!subtitle && <p className="text-[#666] !mb-2 text-xs">{subtitle}</p>}
      <Textarea
        data-test={dataTest}
        className={classNames('fr-input !outline-none', backgroundClassName, {
          '!bg-[#f6f6f6]': !backgroundClassName,
        })}
        minHeight={action.type === 'tache' ? undefined : '5rem'}
        value={commentaire}
        onInputChange={() => null}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
          setCommentaire(event.currentTarget.value);
          onChange?.(event.currentTarget.value);
        }}
        onBlur={() => {
          commentaire.trim() !== (initialValue || '') &&
            onSave({
              action_id: action.id,
              collectivite_id: collectivite.collectivite_id,
              commentaire: commentaire.trim(),
            });
        }}
        disabled={collectivite.readonly || disabled}
        autoFocus={autoFocus}
      />
    </>
  ) : null;
};
