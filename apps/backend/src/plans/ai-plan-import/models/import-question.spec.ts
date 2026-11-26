import { describe, expect, it } from 'vitest';
import {
  type ActionLevelDoubt,
  type ActionsWithoutFicheDoubt,
  answersEveryDoubt,
  changedKindsOf,
  importChoicesSchema,
  proposedReadingChoices,
  readImportQuestion,
  type ThemeGroupingDoubt,
  toReadingChoices,
} from './import-question';

const level = (exampleTitle: string, count: number) => ({
  exampleTitle,
  examplePage: 3,
  count,
});

const doubt: ActionLevelDoubt = {
  kind: 'action-level',
  axes: null,
  fiches: level('Accompagner les habitants', 16),
  fichesWithEtapes: 16,
  etapes: level('Diagnostiquer et orienter', 54),
  proposed: 'fiche',
};

describe('readImportQuestion', () => {
  it('lit la forme actuelle telle quelle', () => {
    const question = {
      doubts: [doubt],
      answer: {
        choices: [{ kind: 'action-level', actionLevel: 'etape' }],
        answeredBy: 'membre-1',
        answeredAt: '2026-11-20T09:05:00Z',
      },
    };

    expect(readImportQuestion(question)).toEqual(question);
  });

  it.each([
    ['sans réponse', null, null],
    [
      'avec sa réponse',
      {
        actionLevel: 'etape',
        answeredBy: 'membre-1',
        answeredAt: '2026-11-20T09:05:00Z',
      },
      {
        choices: [{ kind: 'action-level', actionLevel: 'etape' }],
        answeredBy: 'membre-1',
        answeredAt: '2026-11-20T09:05:00Z',
      },
    ],
  ])(
    'lit un import mis en attente sous l’ancienne forme, %s',
    (_cas, storedAnswer, answer) => {
      expect(readImportQuestion({ ...doubt, answer: storedAnswer })).toEqual({
        doubts: [doubt],
        answer,
      });
    }
  );

  it.each([
    ['vide', null],
    ['sans doute', { doubts: [], answer: null }],
    [
      'à deux doutes de la même sorte',
      { doubts: [doubt, doubt], answer: null },
    ],
    ['d’une sorte inconnue', { doubts: [{ kind: 'inconnue' }], answer: null }],
  ])('ignore une question %s', (_cas, stored) => {
    expect(readImportQuestion(stored)).toBeNull();
  });
});

describe('answersEveryDoubt', () => {
  it('accepte un choix par doute posé', () => {
    expect(
      answersEveryDoubt(
        [doubt],
        [{ kind: 'action-level', actionLevel: 'fiche' }]
      )
    ).toBe(true);
  });

  it.each([
    ['sans choix', []],
    [
      'à deux choix de la même sorte',
      [
        { kind: 'action-level', actionLevel: 'fiche' },
        { kind: 'action-level', actionLevel: 'etape' },
      ],
    ],
  ] as const)('refuse une réponse %s', (_cas, choices) => {
    expect(answersEveryDoubt([doubt], [...choices])).toBe(false);
  });
});

describe('importChoicesSchema', () => {
  it('refuse deux choix de la même sorte', () => {
    expect(
      importChoicesSchema.safeParse([
        { kind: 'action-level', actionLevel: 'fiche' },
        { kind: 'action-level', actionLevel: 'etape' },
      ]).success
    ).toBe(false);
  });
});

describe('changedKindsOf', () => {
  it('relève les sortes dont le choix s’écarte de celui proposé', () => {
    expect(
      changedKindsOf([doubt], [{ kind: 'action-level', actionLevel: 'etape' }])
    ).toEqual(['action-level']);
    expect(
      changedKindsOf([doubt], [{ kind: 'action-level', actionLevel: 'fiche' }])
    ).toEqual([]);
  });
});

describe('toReadingChoices', () => {
  it('range chaque choix pour la lecture', () => {
    expect(
      toReadingChoices(
        [doubt],
        [{ kind: 'action-level', actionLevel: 'etape' }]
      )
    ).toEqual({ actionLevel: 'etape' });
    expect(toReadingChoices([doubt], [])).toEqual({});
  });

  it('dit d’où viennent les étapes quand le doute porte sur une énumération', () => {
    expect(
      toReadingChoices(
        [{ ...doubt, etapesFrom: 'enumeration' }],
        [{ kind: 'action-level', actionLevel: 'fiche' }]
      )
    ).toEqual({ actionLevel: 'fiche', etapesFrom: 'enumeration' });
  });
});

describe('proposedReadingChoices', () => {
  it('applique le choix proposé de chaque doute', () => {
    expect(
      proposedReadingChoices([
        { ...doubt, etapesFrom: 'enumeration', proposed: 'etape' },
      ])
    ).toEqual({ actionLevel: 'etape', etapesFrom: 'enumeration' });
    expect(proposedReadingChoices([])).toEqual({});
  });
});

describe('la question des thèmes', () => {
  const themeDoubt: ThemeGroupingDoubt = {
    kind: 'theme-grouping',
    groups: [
      {
        label: 'BIODÉCHETS : RESTES ALIMENTAIRES ET VÉGÉTAUX',
        labelPage: 3,
        variants: [
          {
            theme: 'BIODECHETS (végétaux)',
            fiches: 1,
            exampleTitle: '3 Broyer',
            page: 28,
          },
          {
            theme: 'BIODECHETS (restes alimentaires)',
            fiches: 2,
            exampleTitle: '4 Lutter',
            page: 31,
          },
        ],
      },
    ],
    proposed: 'grouped',
  };

  it('se pose avec le niveau de l’action, et se relit', () => {
    const question = {
      doubts: [doubt, themeDoubt],
      answer: {
        choices: [
          { kind: 'action-level', actionLevel: 'fiche' },
          { kind: 'theme-grouping', grouping: 'separate' },
        ],
        answeredBy: 'membre-1',
        answeredAt: '2026-11-26T09:05:00Z',
      },
    };

    expect(readImportQuestion(question)).toEqual(question);
    expect(
      answersEveryDoubt(question.doubts, [
        { kind: 'action-level', actionLevel: 'fiche' },
      ])
    ).toBe(false);
  });

  it('refuse un groupe d’un seul thème', () => {
    const [group] = themeDoubt.groups;

    expect(
      readImportQuestion({
        doubts: [
          {
            ...themeDoubt,
            groups: [{ ...group, variants: [group.variants[0]] }],
          },
        ],
        answer: null,
      })
    ).toBeNull();
  });

  it('donne à la lecture le regroupement choisi, avec les groupes du doute', () => {
    expect(
      toReadingChoices(
        [themeDoubt],
        [{ kind: 'theme-grouping', grouping: 'separate' }]
      )
    ).toEqual({
      themeGrouping: { grouping: 'separate', groups: themeDoubt.groups },
    });
    expect(proposedReadingChoices([doubt, themeDoubt])).toEqual({
      actionLevel: 'fiche',
      themeGrouping: { grouping: 'grouped', groups: themeDoubt.groups },
    });
    expect(
      changedKindsOf(
        [doubt, themeDoubt],
        [
          { kind: 'action-level', actionLevel: 'fiche' },
          { kind: 'theme-grouping', grouping: 'separate' },
        ]
      )
    ).toEqual(['theme-grouping']);
  });

  it('ignore un regroupement sans doute sur les thèmes', () => {
    expect(
      toReadingChoices(
        [doubt],
        [{ kind: 'theme-grouping', grouping: 'grouped' }]
      )
    ).toEqual({});
  });
});

describe('la question des actions listées sans fiche', () => {
  const withoutFiche: ActionsWithoutFicheDoubt = {
    kind: 'actions-without-fiche',
    listed: 51,
    withFiche: 24,
    withoutFiche: 27,
    example: {
      title: 'Action à poursuivre 1 : Soutenir la mise en œuvre des PNA',
      page: 48,
    },
    tablePages: [48, 49],
    proposed: 'all',
  };

  it('se pose avec les autres doutes, et se relit avec sa réponse', () => {
    const question = {
      doubts: [doubt, withoutFiche],
      answer: {
        choices: [
          { kind: 'action-level', actionLevel: 'fiche' },
          { kind: 'actions-without-fiche', actions: 'with-fiche' },
        ],
        answeredBy: 'membre-1',
        answeredAt: '2026-11-26T09:05:00Z',
      },
    };

    expect(readImportQuestion(question)).toEqual(question);
  });

  it('refuse un doute sans page du tableau', () => {
    expect(
      readImportQuestion({
        doubts: [{ ...withoutFiche, tablePages: [] }],
        answer: null,
      })
    ).toBeNull();
  });

  it('propose toutes les actions, et relève le choix qui s’en écarte', () => {
    expect(proposedReadingChoices([withoutFiche])).toEqual({
      actionsWithoutFiche: 'all',
    });
    expect(
      changedKindsOf(
        [doubt, withoutFiche],
        [
          { kind: 'action-level', actionLevel: 'fiche' },
          { kind: 'actions-without-fiche', actions: 'with-fiche' },
        ]
      )
    ).toEqual(['actions-without-fiche']);
  });

  it('donne à la lecture les actions à garder', () => {
    expect(
      toReadingChoices(
        [withoutFiche],
        [{ kind: 'actions-without-fiche', actions: 'with-fiche' }]
      )
    ).toEqual({ actionsWithoutFiche: 'with-fiche' });
  });
});
