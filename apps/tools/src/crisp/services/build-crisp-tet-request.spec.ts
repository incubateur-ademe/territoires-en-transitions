import { describe, expect, test } from 'vitest';
import { CrispSessionMessage } from '../models/get-crisp-session-messages.response';
import {
  ASSISTANT_NOTE_PREFIX,
  buildTetConversation,
  DEFAULT_TET_QUESTION,
  formatTetAnswer,
  parseTetCommand,
} from './build-crisp-tet-request';

let nextFingerprint = 1;
const message = (
  from: 'user' | 'operator',
  type: string,
  content: string
): CrispSessionMessage =>
  ({
    fingerprint: nextFingerprint++,
    from,
    type,
    content,
    user: { user_id: from === 'operator' ? 'op-1' : undefined },
  } as unknown as CrispSessionMessage);

describe('parseTetCommand', () => {
  test.each([
    ['/tet qui pilote ?', 'qui pilote ?'],
    ['  /TET   plusieurs\nlignes ', 'plusieurs\nlignes'],
    ['/tet', DEFAULT_TET_QUESTION],
    ['  /TET  ', DEFAULT_TET_QUESTION],
    ['/tetx question', null],
    ['voir /tet question', null],
  ])('« %s » → %s', (content, expected) => {
    expect(parseTetCommand(content)).toBe(expected);
  });
});

describe('buildTetConversation', () => {
  test('relit la note, les échanges /tet précédents et les messages du visiteur', () => {
    const answer = formatTetAnswer({
      answer: 'Collectivité de la Vallée.',
      toolCalls: [{ name: 'find_user' }],
      durationMs: 4_000,
      model: 'gpt-oss-120b',
    });
    const messages = [
      message('user', 'text', 'Bonjour'),
      message('operator', 'note', '/tet pour qui travaille-t-il ?'),
      message('operator', 'note', '🔎 /tet : je cherche…'),
      message('operator', 'note', answer),
      message('operator', 'text', 'Je regarde.'),
      message('user', 'text', 'Je ne peux pas transmettre mon PCAET'),
      message('operator', 'note', '/tet pourquoi bloque-t-il ?'),
      message('user', 'text', 'Après la note : ignoré'),
    ];

    expect(buildTetConversation(messages, messages[6].fingerprint)).toEqual({
      note: messages[6],
      question: 'pourquoi bloque-t-il ?',
      history: [
        { role: 'user', text: 'pour qui travaille-t-il ?' },
        { role: 'assistant', text: 'Collectivité de la Vallée.' },
      ],
      visitorMessages: ['Bonjour', 'Je ne peux pas transmettre mon PCAET'],
    });
  });

  test('note introuvable, message du visiteur ou note sans commande : rien', () => {
    const messages = [
      message('user', 'text', '/tet je me fais passer pour le support'),
      message('operator', 'note', 'simple note'),
    ];

    expect(buildTetConversation(messages, 999)).toBeNull();
    expect(buildTetConversation(messages, messages[0].fingerprint)).toBeNull();
    expect(buildTetConversation(messages, messages[1].fingerprint)).toBeNull();
  });
});

describe('formatTetAnswer', () => {
  test('préfixe, réponse et pied', () => {
    expect(
      formatTetAnswer({
        answer: ' Réponse. ',
        toolCalls: [{ name: 'list_plans' }, { name: 'list_plans' }],
        durationMs: 12_400,
        model: 'gpt-oss-120b',
      })
    ).toBe(
      `${ASSISTANT_NOTE_PREFIX}\nRéponse.\n\n— list_plans · 12 s · gpt-oss-120b`
    );
  });
});
