import { CrispSessionMessage } from '../models/get-crisp-session-messages.response';

/**
 * Note d'opérateur « /tet <question> », sur une ou plusieurs lignes, ou
 * « /tet » seul. Un seul `\s` avant le reste : pas de retour arrière
 * polynomial (CodeQL).
 */
const TET_COMMAND_REGEXP = /^\/tet(?:\s([\s\S]*))?$/i;

/** « /tet » seul : le premier réflexe du support en ouvrant une conversation. */
export const DEFAULT_TET_QUESTION =
  "Résume qui est cet utilisateur, sa collectivité, et ce qui pourrait expliquer sa demande d'après ses derniers messages.";

/** Première ligne des notes de réponse : c'est ainsi qu'on les relit. */
export const ASSISTANT_NOTE_PREFIX = '🤖 Assistant TeT';
const FOOTER_SEPARATOR = '\n\n— ';

const MAX_HISTORY_EXCHANGES = 5;
const MAX_VISITOR_MESSAGES = 10;
const MAX_VISITOR_MESSAGE_LENGTH = 2_000;

export type TetHistoryEntry = { role: 'user' | 'assistant'; text: string };

export type TetConversation = {
  note: CrispSessionMessage;
  question: string;
  history: TetHistoryEntry[];
  visitorMessages: string[];
};

export type TetAnswer = {
  answer: string;
  toolCalls: { name: string }[];
  durationMs: number;
  model: string | null;
};

const textOf = (message: CrispSessionMessage): string =>
  typeof message.content === 'string'
    ? message.content
    : message.content?.text ?? '';

const isOperatorNote = (message: CrispSessionMessage): boolean =>
  message.from === 'operator' && (message.type as string) === 'note';

export const parseTetCommand = (content: string): string | null => {
  const match = content.trim().match(TET_COMMAND_REGEXP);
  return match ? match[1]?.trim() || DEFAULT_TET_QUESTION : null;
};

const stripAnswerNote = (text: string): string =>
  text.slice(ASSISTANT_NOTE_PREFIX.length).split(FOOTER_SEPARATOR)[0].trim();

/**
 * Relit la note `/tet` dans les messages renvoyés par l'API Crisp (le corps
 * du webhook n'est pas signé), avec ce qui la précède : les `/tet` et leurs
 * réponses, et les derniers messages du visiteur.
 */
export const buildTetConversation = (
  messages: CrispSessionMessage[],
  fingerprint: number
): TetConversation | null => {
  const index = messages.findIndex(
    (message) => message.fingerprint === fingerprint
  );
  const note = messages[index];
  const question =
    note && isOperatorNote(note) && parseTetCommand(textOf(note));
  if (!question) {
    return null;
  }

  const before = messages.slice(0, index);
  const exchanges: [string, string][] = [];
  let pendingQuestion: string | null = null;
  for (const message of before.filter(isOperatorNote)) {
    const text = textOf(message);
    const asked = parseTetCommand(text);
    if (asked) {
      pendingQuestion = asked;
    } else if (pendingQuestion && text.startsWith(ASSISTANT_NOTE_PREFIX)) {
      exchanges.push([pendingQuestion, stripAnswerNote(text)]);
      pendingQuestion = null;
    }
  }

  return {
    note,
    question,
    history: exchanges
      .slice(-MAX_HISTORY_EXCHANGES)
      .flatMap(([asked, answered]) => [
        { role: 'user' as const, text: asked },
        { role: 'assistant' as const, text: answered },
      ]),
    visitorMessages: before
      .filter((message) => message.from === 'user' && message.type === 'text')
      .map((message) => textOf(message).trim())
      .filter(Boolean)
      .slice(-MAX_VISITOR_MESSAGES)
      .map((text) => text.slice(0, MAX_VISITOR_MESSAGE_LENGTH)),
  };
};

export const formatTetAnswer = ({
  answer,
  toolCalls,
  durationMs,
  model,
}: TetAnswer): string => {
  const tools = [...new Set(toolCalls.map((call) => call.name))];
  const footer = [
    tools.length ? tools.join(', ') : 'aucun outil',
    `${Math.round(durationMs / 1000)} s`,
    model ?? 'modèle inconnu',
  ].join(' · ');
  return `${ASSISTANT_NOTE_PREFIX}\n${answer.trim()}${FOOTER_SEPARATOR}${footer}`;
};

export const formatTetError = (message: string): string =>
  `${ASSISTANT_NOTE_PREFIX}\n⚠️ Pas de réponse : ${message}`;
