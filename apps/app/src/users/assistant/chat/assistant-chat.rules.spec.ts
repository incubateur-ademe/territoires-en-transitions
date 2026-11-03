import { describe, expect, it } from 'vitest';
import {
  buildHistory,
  ChatTurn,
  lastSuggestions,
  MAX_HISTORY_TURNS,
} from './assistant-chat.rules';

const assistant = (id: string, text: string): ChatTurn => ({
  id,
  role: 'assistant',
  text,
  suggestions: {
    question: 'Quelle période ?',
    options: ['30 jours', '90 jours'],
  },
  actions: [],
});

describe('buildHistory', () => {
  it('garde les échanges, sans les erreurs, et au plus 20 tours', () => {
    const turns: ChatTurn[] = [
      { id: '1', role: 'user', text: 'Bonjour' },
      { id: '2', role: 'error', text: 'Délai dépassé' },
      assistant('3', 'Que voulez-vous savoir ?'),
    ];
    expect(buildHistory(turns)).toEqual([
      { role: 'user', text: 'Bonjour' },
      { role: 'assistant', text: 'Que voulez-vous savoir ?' },
    ]);

    const many: ChatTurn[] = Array.from({ length: 30 }, (_, index) => ({
      id: String(index),
      role: 'user',
      text: `q${index}`,
    }));
    const history = buildHistory(many);
    expect(history).toHaveLength(MAX_HISTORY_TURNS);
    expect(history.at(-1)).toEqual({ role: 'user', text: 'q29' });
  });
});

describe('lastSuggestions', () => {
  it('ne propose les choix que de la dernière réponse', () => {
    const turns: ChatTurn[] = [assistant('1', 'Quelle période ?')];
    expect(lastSuggestions(turns)?.options).toEqual(['30 jours', '90 jours']);
    expect(
      lastSuggestions([...turns, { id: '2', role: 'user', text: '30 jours' }])
    ).toBeNull();
  });
});
