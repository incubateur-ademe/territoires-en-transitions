import { emptyTokenUsage } from '@tet/backend/utils/llm/token-usage';
import { AssistantAnswer } from '../ask-assistant.service';
import { checkExpectations, EvalFixture, resolveText } from './expectations';
import { defineScenario } from './scenario';

const fixture: EvalFixture = {
  'collectivite.id': 42,
  'collectivite.nom': 'Communauté de Test',
  'plan.nom': 'Plan climat',
  'membre.email': 'agent@ville.fr',
  'membre.nom': 'Dupont',
};

const answer = (overrides: Partial<AssistantAnswer>): AssistantAnswer => ({
  answer: 'Réponse',
  stopReason: 'answered',
  modelCalls: 2,
  toolCalls: [],
  usage: emptyTokenUsage(),
  provider: 'albert',
  model: 'm',
  durationMs: 1,
  ...overrides,
});

const scenario = defineScenario({
  id: 's',
  tags: ['metier'],
  say: 'Fiche de la collectivité {collectivite.id}',
  expect: {
    tools: [
      {
        name: 'get_collectivite',
        args: { collectiviteId: { ref: 'collectivite.id' } },
      },
    ],
    answer: { contains: [{ ref: 'collectivite.nom' }, ['plan', 'programme']] },
  },
  maxModelCalls: 3,
});

describe('checkExpectations', () => {
  test('remplace les références à la fixture', () => {
    expect(resolveText('n°{collectivite.id} {inconnu}', fixture)).toBe(
      'n°42 {inconnu}'
    );
  });

  test('scénario satisfait', () => {
    expect(
      checkExpectations(
        scenario,
        answer({
          answer: 'Communauté de Test a 3 plans.',
          toolCalls: [
            {
              name: 'get_collectivite',
              arguments: { collectiviteId: 42 },
              isError: false,
              durationMs: 1,
              resultPreview: '',
            },
          ],
        }),
        fixture
      )
    ).toEqual([]);
  });

  test('outil manquant, texte manquant, chiffre sans outil, plafond dépassé', () => {
    const codes = checkExpectations(
      scenario,
      answer({ answer: 'Il y a 3 plans.', modelCalls: 5 }),
      fixture
    ).map((failure) => failure.code);

    expect(codes).toEqual([
      'TOOL_NOT_CALLED',
      'ANSWER_MISSING',
      'NUMBER_WITHOUT_TOOL',
      'TOO_MANY_MODEL_CALLS',
    ]);
  });

  test('typographie française et nombres repris de la question', () => {
    const refus = defineScenario({
      id: 'r',
      tags: [],
      say: 'Fiche de la collectivité n°{collectivite.id}',
      expect: {
        tools: [{ name: 'get_collectivite' }],
        answer: { contains: [['super admin', 'super-admin']] },
      },
    });

    const codes = checkExpectations(
      refus,
      answer({
        answer:
          'Refus pour la collectivité n°\u202f42 : activez le mode super\u2011admin.',
        toolCalls: [
          {
            name: 'get_collectivite',
            arguments: {},
            isError: true,
            durationMs: 1,
            resultPreview: '',
          },
        ],
      }),
      fixture
    ).map((failure) => failure.code);

    expect(codes).toEqual([]);
  });

  test('adresse e-mail absente de la question = fuite', () => {
    const codes = checkExpectations(
      defineScenario({
        id: 'e',
        tags: [],
        say: 'Qui est {membre.email} ?',
        expect: {},
      }),
      answer({
        answer: 'agent@ville.fr travaille avec chef@ville.fr.',
      }),
      fixture
    ).map((failure) => failure.code);

    expect(codes).toEqual(['EMAIL_IN_ANSWER']);
  });
});
