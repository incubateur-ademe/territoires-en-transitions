'use client';
import { appLabels } from '@/app/labels/catalog';
import Markdown from '@/app/ui/Markdown';
import { useUser } from '@tet/api/users';
import { getErrorMessage } from '@tet/domain/utils';
import { hasRole, PlatformRole } from '@tet/domain/users';
import { Button, Textarea } from '@tet/ui';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { AlbertLogo } from '../assistant-logos';
import { AssistantActionCard } from './assistant-action.card';
import {
  buildHistory,
  ChatTurn,
  lastSuggestions,
} from './assistant-chat.rules';
import { useAskAssistant } from './data/use-ask-assistant';

const MARKDOWN_CLASSNAME =
  'text-sm [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm [&_table]:my-2 [&_table]:text-xs [&_th]:border [&_th]:border-grey-3 [&_th]:bg-grey-2 [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-grey-3 [&_td]:px-2 [&_td]:py-1';

let turnCounter = 0;
const nextId = () => `turn-${++turnCounter}`;

const Turn = ({
  turn,
  canConfirm,
}: {
  turn: ChatTurn;
  canConfirm: boolean;
}) => {
  if (turn.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="m-0 max-w-[80%] whitespace-pre-wrap rounded-xl bg-primary-1 px-4 py-2 text-sm text-primary-9">
          {turn.text}
        </p>
      </div>
    );
  }
  if (turn.role === 'error') {
    return (
      <p
        className="m-0 rounded-xl bg-error-2 px-4 py-2 text-sm text-error-1"
        data-test="profil.assistant.chat.erreur"
      >
        {appLabels.assistantChatErreur(turn.text)}
      </p>
    );
  }
  return (
    <div className="flex gap-3" data-test="profil.assistant.chat.reponse">
      <AlbertLogo className="mt-1 h-6 w-auto shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Markdown
          content={turn.text}
          className={MARKDOWN_CLASSNAME}
          openLinksInNewTab
        />
        {turn.actions.map((action) => (
          <AssistantActionCard
            key={action.actionToken}
            action={action}
            canConfirm={canConfirm}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Assistant de l'app : le même agent que dans Claude et Crisp, animé par
 * Albert, qui propose des choix quand la demande est floue et prépare des
 * écritures à confirmer. La conversation vit dans la page, rien n'est stocké.
 */
export const AssistantChat = () => {
  const user = useUser();
  const canConfirm = hasRole(user, PlatformRole.SUPPORT);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState('');
  const { mutate, isPending } = useAskAssistant();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [turns, isPending]);

  const send = (text: string) => {
    const question = text.trim();
    if (!question || isPending) {
      return;
    }
    const history = buildHistory(turns);
    setTurns((previous) => [
      ...previous,
      { id: nextId(), role: 'user', text: question },
    ]);
    setDraft('');
    mutate(
      { question, history, mode: 'app' },
      {
        onSuccess: (answer) =>
          setTurns((previous) => [
            ...previous,
            {
              id: nextId(),
              role: 'assistant',
              text: answer.answer,
              suggestions: answer.suggestions,
              actions: answer.actions,
            },
          ]),
        onError: (error) =>
          setTurns((previous) => [
            ...previous,
            { id: nextId(), role: 'error', text: getErrorMessage(error) },
          ]),
      }
    );
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send(draft);
    }
  };

  const suggestions = isPending ? null : lastSuggestions(turns);

  return (
    <div className="flex flex-col gap-4" data-test="profil.assistant.chat">
      {turns.length > 0 && (
        <div className="flex flex-col gap-4">
          {turns.map((turn) => (
            <Turn key={turn.id} turn={turn} canConfirm={canConfirm} />
          ))}
        </div>
      )}

      {isPending && (
        <div className="flex items-center gap-3 text-sm text-grey-8">
          <AlbertLogo className="h-6 w-auto shrink-0 animate-pulse" />
          {appLabels.assistantChatReflexion}
        </div>
      )}

      {suggestions && (
        <div
          className="flex flex-wrap gap-2"
          data-test="profil.assistant.chat.suggestions"
        >
          {suggestions.options.map((option) => (
            <Button
              key={option}
              variant="outlined"
              size="xs"
              onClick={() => send(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      )}

      <div ref={endRef} />

      <div className="flex items-end gap-2">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onKeyDown={onKeyDown}
          placeholder={appLabels.assistantChatPlaceholder}
          rows={2}
          disabled={isPending}
          data-test="profil.assistant.chat.saisie"
        />
        <Button
          icon="send-plane-fill"
          title={appLabels.assistantChatEnvoyer}
          disabled={isPending || draft.trim().length === 0}
          onClick={() => send(draft)}
          dataTest="profil.assistant.chat.envoyer"
        />
      </div>
      {turns.length > 0 && (
        <Button
          variant="underlined"
          size="xs"
          className="self-start"
          disabled={isPending}
          onClick={() => setTurns([])}
          dataTest="profil.assistant.chat.nouvelle-conversation"
        >
          {appLabels.assistantChatNouvelleConversation}
        </Button>
      )}
    </div>
  );
};
