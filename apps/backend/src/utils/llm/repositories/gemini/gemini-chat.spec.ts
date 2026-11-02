import { toGeminiContents } from './gemini.repository';

describe('Gemini : conversation avec outils', () => {
  test('regroupe les réponses d’outils et rejoue le contenu du modèle tel quel', () => {
    const replayed = {
      role: 'model',
      parts: [
        {
          thoughtSignature: 'sig',
          functionCall: { id: 'c1', name: 'a', args: {} },
        },
        { functionCall: { id: 'c2', name: 'b', args: { x: 1 } } },
      ],
    };

    const contents = toGeminiContents([
      { role: 'user', text: 'Question' },
      {
        role: 'assistant',
        toolCalls: [
          { id: 'c1', name: 'a', arguments: {} },
          { id: 'c2', name: 'b', arguments: { x: 1 } },
        ],
        providerData: replayed,
      },
      { role: 'tool', toolCallId: 'c1', name: 'a', content: 'r1' },
      { role: 'tool', toolCallId: 'c2', name: 'b', content: 'r2' },
      { role: 'user', text: 'Suite' },
    ]);

    expect(contents).toEqual([
      { role: 'user', parts: [{ text: 'Question' }] },
      { role: 'model', parts: replayed.parts },
      {
        role: 'user',
        parts: [
          {
            functionResponse: {
              id: 'c1',
              name: 'a',
              response: { result: 'r1' },
            },
          },
          {
            functionResponse: {
              id: 'c2',
              name: 'b',
              response: { result: 'r2' },
            },
          },
        ],
      },
      { role: 'user', parts: [{ text: 'Suite' }] },
    ]);
  });

  test('sans contenu du fournisseur, reconstruit le tour du modèle', () => {
    expect(
      toGeminiContents([
        {
          role: 'assistant',
          text: 'Réponse',
          toolCalls: [{ id: 'c1', name: 'a', arguments: { y: 2 } }],
        },
      ])
    ).toEqual([
      {
        role: 'model',
        parts: [
          { text: 'Réponse' },
          { functionCall: { id: 'c1', name: 'a', args: { y: 2 } } },
        ],
      },
    ]);
  });
});
