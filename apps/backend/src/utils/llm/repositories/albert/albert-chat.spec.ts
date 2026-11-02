import { toChatToolsParams, toLlmToolCall } from './albert.repository';

describe('Albert : conversation avec outils', () => {
  test('traduit outils, appels et résultats au format OpenAI', () => {
    const params = toChatToolsParams(
      'gpt-oss-120b',
      {
        tier: 'strong',
        systemInstruction: 'Consignes',
        tools: [
          {
            name: 'get_collectivite',
            description: 'Fiche',
            parameters: { type: 'object', properties: {} },
          },
        ],
        messages: [
          { role: 'user', text: 'Question' },
          {
            role: 'assistant',
            toolCalls: [
              {
                id: 'c1',
                name: 'get_collectivite',
                arguments: { collectiviteId: 1 },
              },
            ],
          },
          {
            role: 'tool',
            toolCallId: 'c1',
            name: 'get_collectivite',
            content: '{}',
          },
        ],
      },
      { reasoningEffort: 'medium' }
    );

    expect(params).toMatchObject({
      model: 'gpt-oss-120b',
      tool_choice: 'auto',
      reasoning_effort: 'medium',
      tools: [{ type: 'function', function: { name: 'get_collectivite' } }],
      messages: [
        { role: 'system', content: 'Consignes' },
        { role: 'user', content: 'Question' },
        {
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'c1',
              type: 'function',
              function: {
                name: 'get_collectivite',
                arguments: '{"collectiviteId":1}',
              },
            },
          ],
        },
        { role: 'tool', tool_call_id: 'c1', content: '{}' },
      ],
    });
    expect(params).not.toHaveProperty('stream');
  });

  test('sans outils ou avec toolChoice none, ni tools ni tool_choice', () => {
    const base = {
      tier: 'strong' as const,
      messages: [{ role: 'user' as const, text: 'Q' }],
    };
    expect(toChatToolsParams('m', { ...base, tools: [] })).not.toHaveProperty(
      'tools'
    );
    expect(
      toChatToolsParams('m', {
        ...base,
        toolChoice: 'none',
        tools: [{ name: 't', description: 'd', parameters: {} }],
      })
    ).not.toHaveProperty('tool_choice');
  });

  test('arguments : vides, objet, JSON invalide, non-objet', () => {
    expect(toLlmToolCall('a', 't', '')).toEqual({
      id: 'a',
      name: 't',
      arguments: {},
    });
    expect(toLlmToolCall('a', 't', '{"x":1}')).toEqual({
      id: 'a',
      name: 't',
      arguments: { x: 1 },
    });
    expect(toLlmToolCall('a', 't', '{x')).toMatchObject({
      arguments: {},
      argumentsError: expect.stringContaining('illisibles'),
    });
    expect(toLlmToolCall('a', 't', '[1]')).toMatchObject({
      argumentsError: expect.stringContaining('objet'),
    });
  });
});
