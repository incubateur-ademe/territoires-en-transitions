import { RouterOutput } from '@tet/api';

export type AssistantAnswer = RouterOutput['assistant']['ask'];
export type AssistantPendingAction = AssistantAnswer['actions'][number];

export type ChatTurn =
  | { id: string; role: 'user'; text: string }
  | {
      id: string;
      role: 'assistant';
      text: string;
      suggestions: AssistantAnswer['suggestions'];
      actions: AssistantPendingAction[];
    }
  | { id: string; role: 'error'; text: string };

/** Limites de `assistant.ask` : 20 tours d'historique, 20 000 caractères. */
export const MAX_HISTORY_TURNS = 20;
const MAX_HISTORY_TEXT_LENGTH = 20_000;

/**
 * Historique renvoyé au serveur à chaque question : rien n'est stocké côté
 * serveur. Les erreurs n'en font pas partie.
 */
export const buildHistory = (
  turns: ChatTurn[]
): { role: 'user' | 'assistant'; text: string }[] =>
  turns
    .flatMap((turn) =>
      turn.role === 'error'
        ? []
        : [
            {
              role: turn.role,
              text: turn.text.slice(0, MAX_HISTORY_TEXT_LENGTH),
            },
          ]
    )
    .slice(-MAX_HISTORY_TURNS);

/** Les choix cliquables ne valent que pour la dernière réponse. */
export const lastSuggestions = (
  turns: ChatTurn[]
): AssistantAnswer['suggestions'] => {
  const last = turns.at(-1);
  return last?.role === 'assistant' ? last.suggestions : null;
};
