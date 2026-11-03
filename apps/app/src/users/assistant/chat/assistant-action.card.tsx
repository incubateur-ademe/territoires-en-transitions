'use client';
import { appLabels } from '@/app/labels/catalog';
import { getErrorMessage } from '@tet/domain/utils';
import { Button } from '@tet/ui';
import { useState } from 'react';
import { AssistantPendingAction } from './assistant-chat.rules';
import { useConfirmAssistantAction } from './data/use-confirm-assistant-action';

type Props = {
  action: AssistantPendingAction;
  /** Rôle support : seul à pouvoir écrire, le mode super-admin ne suffit pas. */
  canConfirm: boolean;
};

/**
 * Écriture préparée par l'assistant : rien n'est fait tant que l'utilisateur
 * n'a pas confirmé ici.
 */
export const AssistantActionCard = ({ action, canConfirm }: Props) => {
  const { mutate, isPending, data, error } = useConfirmAssistantAction();
  const [isCancelled, setIsCancelled] = useState(false);
  const isDone = Boolean(data) || isCancelled;

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-warning-1 bg-warning-2 p-4"
      data-test="profil.assistant.chat.action"
    >
      <p className="m-0 text-sm font-bold text-primary-9">
        {appLabels.assistantChatActionTitre}
      </p>
      <p className="m-0 text-sm">
        {appLabels.assistantChatActionAjoutSegment({
          segment: action.segment,
          conversations: appLabels.assistantChatConversationCrisp({
            count: action.conversations,
          }),
          dateFrom: action.dateFrom,
          dateTo: action.dateTo,
        })}
      </p>
      {!action.segmentExistant && (
        <p className="m-0 text-sm text-grey-8">
          {appLabels.assistantChatActionNouveauSegment}
        </p>
      )}
      {action.dejaTaguees > 0 && (
        <p className="m-0 text-sm text-grey-8">
          {appLabels.assistantChatActionDejaTaguees({
            count: action.dejaTaguees,
          })}
        </p>
      )}

      {data && (
        <p className="m-0 text-sm font-medium text-success-1">
          {appLabels.assistantChatActionResultat(data)}
        </p>
      )}
      {isCancelled && (
        <p className="m-0 text-sm text-grey-8">
          {appLabels.assistantChatActionAnnulee}
        </p>
      )}
      {error && (
        <p className="m-0 text-sm text-error-1">
          {appLabels.assistantChatActionErreur(getErrorMessage(error))}
        </p>
      )}

      {!isDone &&
        (canConfirm ? (
          <div className="flex gap-2">
            <Button
              size="xs"
              icon="check-line"
              loading={isPending}
              disabled={isPending}
              onClick={() => mutate({ actionToken: action.actionToken })}
              dataTest="profil.assistant.chat.action-confirmer"
            >
              {appLabels.assistantChatActionConfirmer}
            </Button>
            <Button
              size="xs"
              variant="outlined"
              disabled={isPending}
              onClick={() => setIsCancelled(true)}
              dataTest="profil.assistant.chat.action-annuler"
            >
              {appLabels.assistantChatActionAnnuler}
            </Button>
          </div>
        ) : (
          <p className="m-0 text-sm text-grey-8">
            {appLabels.assistantChatActionReserveeSupport}
          </p>
        ))}
    </div>
  );
};
