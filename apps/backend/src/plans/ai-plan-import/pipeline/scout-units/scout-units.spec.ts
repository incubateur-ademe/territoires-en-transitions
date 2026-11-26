import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import type { ThemeGroup } from '../../models/import-question';
import {
  SEPARATE_THEMES_RULE,
  THEMES_RULE,
} from '../../prompts/squelette.prompt';
import { buildUnit, numberUnits } from '../segment-document/document-unit';
import { classifyUnits } from './classify-units';
import { parseStructuredResponse } from '@tet/backend/utils/llm/parse-json-response';
import { extractSkeleton, skeletonResponseSchema } from './extract-skeleton';
import { scoutUnits } from './scout-units';

const tokens = {
  promptTokens: 10,
  cachedTokens: 0,
  candidatesTokens: 4,
  thoughtsTokens: 1,
  totalTokens: 15,
};

const unit = (
  text: string,
  kind: 'fiche' | 'section' | 'unknown',
  headingPath: string[] = [],
  section?: string
) => buildUnit([{ text, pageIndex: 0 }], headingPath, kind, { section });

const units = numberUnits([
  unit('Sommaire : Axe 1 Bâtiments, Axe 2 Mobilité', 'section'),
  unit('Le territoire compte 12 000 habitants et émet 80 ktCO2.', 'section', [
    '1 Bâtiments',
  ]),
  unit('Action 1.1.1 : Isoler les écoles. Pilote : Service', 'fiche', [
    '1 Bâtiments',
  ]),
  unit('Développer le covoiturage. Budget 20 000 €', 'unknown', ['2 Mobilité']),
]);

type Call = { prompt: string; tier?: string; schema: unknown };

const llmRouting = (
  classify: (call: Call) => unknown,
  skeleton: (call: Call) => unknown = () => ({ axes: [] })
) => {
  const calls: Call[] = [];
  const llm = {
    generateStructured: vi.fn(async (call: Call) => {
      calls.push(call);
      const data = call.prompt.includes('agent de tri documentaire')
        ? classify(call)
        : skeleton(call);
      return success({ data, tokens });
    }),
  } as unknown as Pick<LlmService, 'generateStructured'>;
  return { llm, calls };
};

describe('classifyUnits', () => {
  it('trie par lots avec le palier léger et ne garde que les index demandés', async () => {
    const { llm, calls } = llmRouting(() => [
      { index: 0, type: 'structure' },
      { index: 1, type: 'diagnostic' },
      { index: 99, type: 'autre' },
    ]);

    const result = await classifyUnits(llm, { units });

    expect(calls[0]).toMatchObject({ tier: 'light' });
    expect(calls[0].prompt).toContain(
      '#2 | pages 1–1 | 1 Bâtiments | Action 1.1.1'
    );
    expect(calls[0].prompt).toContain('#0 | pages 1–1 | - | Sommaire');
    expect(result.success).toBe(true);
    if (result.success) {
      expect([...result.data.categories.entries()]).toEqual([
        [0, 'structure'],
        [1, 'diagnostic'],
      ]);
    }
  });
});

describe('extractSkeleton', () => {
  it('ne demande rien sans titre ni extrait de structure', async () => {
    const { llm } = llmRouting(() => []);

    const result = await extractSkeleton(llm, {
      units: [unit('Texte', 'unknown')],
      structureUnits: [],
    });

    expect(result).toEqual(
      success({ skeleton: null, modelDoubt: null, tokens: expect.anything() })
    );
    expect(llm.generateStructured).not.toHaveBeenCalled();
  });

  it('cite les titres relevés et les extraits de structure au palier fort', async () => {
    const { llm, calls } = llmRouting(
      () => [],
      () => ({ axes: [{ numero: '1', titre: 'Bâtiments', sousAxes: [] }] })
    );

    const result = await extractSkeleton(llm, {
      units,
      structureUnits: [units[0]],
    });

    expect(calls[0]).toMatchObject({ tier: 'strong' });
    expect(calls[0].prompt).toContain('1 Bâtiments\n2 Mobilité');
    expect(calls[0].prompt).toContain('Sommaire : Axe 1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skeleton?.axes[0].titre).toBe('Bâtiments');
    }
  });
});

describe('extractSkeleton, avec des fiches', () => {
  it('cite les titres des fiches et retire les sous-axes qui en reprennent un', async () => {
    const { llm, calls } = llmRouting(
      () => [],
      () => ({
        axes: [
          {
            numero: 'I',
            titre: 'Tous héros ordinaires',
            sousAxes: [
              {
                numero: '1',
                titre: 'Ancrer l’administration dans l’écoresponsabilité',
              },
              { numero: 'I.A', titre: 'Mobiliser les acteurs publics' },
            ],
          },
        ],
      })
    );
    const fiche = {
      ...unit('Texte de la fiche', 'fiche', ['I TOUS HÉROS ORDINAIRES']),
      title: '1 ANCRER L’ADMINISTRATION DANS L’ECO-RESPONSABILITE',
    };

    const result = await extractSkeleton(llm, {
      units: [fiche],
      structureUnits: [],
    });

    expect(calls[0].prompt).toContain(
      '1 ANCRER L’ADMINISTRATION DANS L’ECO-RESPONSABILITE'
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skeleton?.axes[0].sousAxes).toEqual([
        { numero: 'I.A', titre: 'Mobiliser les acteurs publics' },
      ]);
    }
  });
});

describe('extractSkeleton, avec des thèmes que la synthèse réunit', () => {
  const groups: ThemeGroup[] = [
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
          fiches: 1,
          exampleTitle: '4 Lutter',
          page: 31,
        },
      ],
    },
  ];
  const fiches = [
    {
      ...unit('Broyer', 'fiche', ['BIODECHETS (végétaux)']),
      title: '3 Broyer',
    },
    {
      ...unit('Lutter', 'fiche', ['BIODECHETS (restes alimentaires)']),
      title: '4 Lutter',
    },
  ];
  // Le modèle réunit les thèmes, quelle que soit la consigne.
  const merged = () => ({
    axes: [
      {
        numero: '1',
        titre: 'Biodéchets : restes alimentaires et végétaux',
        sousAxes: [],
      },
    ],
  });

  it('garde la règle des thèmes et l’axe réuni sans réponse ou pour les réunir', async () => {
    for (const themeGrouping of [
      undefined,
      { grouping: 'grouped' as const, groups },
    ]) {
      const { llm, calls } = llmRouting(() => [], merged);

      const result = await extractSkeleton(llm, {
        units: fiches,
        structureUnits: [],
        themeGrouping,
      });

      expect(calls[0].prompt).toContain(THEMES_RULE);
      expect(calls[0].prompt).not.toContain(SEPARATE_THEMES_RULE);
      expect(result.success && result.data.skeleton?.axes).toHaveLength(1);
    }
  });

  it('demande un axe par thème des fiches, et redécoupe l’axe que le modèle réunit quand même', async () => {
    const { llm, calls } = llmRouting(() => [], merged);

    const result = await extractSkeleton(llm, {
      units: fiches,
      structureUnits: [],
      themeGrouping: { grouping: 'separate', groups },
    });

    expect(calls[0].prompt).toContain(SEPARATE_THEMES_RULE);
    expect(calls[0].prompt).not.toContain(THEMES_RULE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        result.data.skeleton?.axes.map(({ numero, titre }) => [numero, titre])
      ).toEqual([
        ['1', 'BIODECHETS (végétaux)'],
        ['2', 'BIODECHETS (restes alimentaires)'],
      ]);
    }
  });
});

describe('extractSkeleton, avec des mesures qui rangent des actions', () => {
  it('garde pour sous-axe la mesure aux actions lettrées, retire la fiche au titre écourté', async () => {
    const { llm, calls } = llmRouting(
      () => [],
      () => ({
        axes: [
          {
            numero: '1',
            titre: 'Garantir le droit à se déplacer',
            sousAxes: [
              { numero: '1.1', titre: 'Développer l’usage du vélo' },
              { numero: '1.3', titre: 'Faciliter l’organisation' },
            ],
          },
        ],
      })
    );
    const mesure = {
      ...buildUnit(
        [
          'Mesure 1.1 : Développer l’usage du vélo',
          'A – Organiser des bourses à vélo',
          'B – Soutenir la réparation de vélos',
        ].map((text) => ({ text, pageIndex: 0 })),
        ['1 Garantir le droit à se déplacer'],
        'fiche'
      ),
      title: '1.1 Développer l’usage du vélo',
    };
    const fiche = {
      ...unit('Pilote : Direction', 'fiche'),
      title: '1.3 Faciliter l’organisation de manifestations responsables',
    };

    const result = await extractSkeleton(llm, {
      units: [mesure, fiche],
      structureUnits: [],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skeleton?.axes[0].sousAxes).toEqual([
        { numero: '1.1', titre: 'Développer l’usage du vélo' },
      ]);
    }
    // Hors des extraits de structure, la mesure dit son regroupement.
    expect(calls[0].prompt).toContain(
      '1.1 Développer l’usage du vélo (regroupe : « A – Organiser des bourses à vélo », « B – Soutenir la réparation de vélos »)'
    );
    expect(calls[0].prompt).toContain(
      '1.3 Faciliter l’organisation de manifestations responsables\n'
    );
  });
});

describe('extractSkeleton, avec des fiches que leur cartouche nomme actions', () => {
  it('ne fait pas un sous-axe de la fiche dont les A, B, C sont les sous-actions', async () => {
    const { llm, calls } = llmRouting(
      () => [],
      () => ({
        axes: [
          {
            numero: '1',
            titre: 'S’adapter aux enjeux du futur',
            sousAxes: [{ numero: '1.1', titre: 'Anticiper les défis' }],
          },
        ],
      })
    );
    const fiche = {
      ...buildUnit(
        [
          'Titre de l’action 1.1 Anticiper les défis',
          'Synthèse A. Définir un groupe de réflexion',
          'B. Elargir les missions du conseil',
          'C. Disposer d’une personne à temps partiel',
        ].map((text) => ({ text, pageIndex: 0 })),
        ['1 S’adapter aux enjeux du futur'],
        'fiche'
      ),
      title: '1.1 Anticiper les défis',
    };

    const result = await extractSkeleton(llm, {
      units: [fiche],
      structureUnits: [],
    });

    expect(calls[0].prompt).not.toContain('Anticiper les défis (regroupe');
    expect(result.success && result.data.skeleton?.axes[0].sousAxes).toEqual(
      []
    );
  });
});

describe('extractSkeleton, avec des parties titrées', () => {
  it('range les titres sous leur partie du document', async () => {
    const { llm, calls } = llmRouting(
      () => [],
      () => ({ axes: [] })
    );

    await extractSkeleton(llm, {
      units: [
        unit('Bilan', 'section', ['I BILAN ÉNERGÉTIQUE'], 'ÉTAT DES LIEUX'),
        unit('Ancrer', 'fiche', ['I TOUS HÉROS'], "PLAN D'ACTIONS"),
      ],
      structureUnits: [],
    });

    expect(calls[0].prompt).toContain(
      "Partie « ÉTAT DES LIEUX »\n  I BILAN ÉNERGÉTIQUE\nPartie « PLAN D'ACTIONS »\n  I TOUS HÉROS"
    );
  });
});

describe('scoutUnits', () => {
  it('écarte sans les trier les engagements des partenaires, fiches comprises', async () => {
    const { llm, calls } = llmRouting(() => [
      { index: 0, type: 'fiche_action' },
    ]);

    const result = await scoutUnits(llm, {
      units: [
        unit('Action 1 : Isoler', 'fiche', [], "PLAN D'ACTIONS"),
        unit(
          'ACTION 14 : nos bornes',
          'fiche',
          [],
          'ENGAGEMENT DES PARTENAIRES'
        ),
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keptUnits.map((u) => u.text)).toEqual([
        'Action 1 : Isoler',
      ]);
      expect(result.data.discardedCount).toBe(1);
    }
    expect(calls[0].prompt).not.toContain('nos bornes');
  });

  it('écarte un engagement de partenaire repéré par le tri, sauf une fiche', async () => {
    const { llm } = llmRouting(() => [
      { index: 0, type: 'engagement_partenaire' },
      { index: 1, type: 'engagement_partenaire' },
    ]);

    const result = await scoutUnits(llm, {
      units: [
        unit('La société X s’engage à…', 'section'),
        unit('Action 2 : Covoiturage', 'fiche'),
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keptUnits.map((u) => u.text)).toEqual([
        'Action 2 : Covoiturage',
      ]);
    }
  });

  it('écarte le diagnostic et, faute de fiches ailleurs, garde fiches, tables et unités oubliées', async () => {
    const { llm } = llmRouting(() => [
      { index: 0, type: 'structure' },
      { index: 1, type: 'diagnostic' },
      { index: 2, type: 'autre' }, // une fiche reconnue au découpage reste
      // l'index 3 est oublié par le modèle : il reste
    ]);

    const result = await scoutUnits(llm, { units });

    expect(result.success).toBe(true);
    if (result.success) {
      // Le sommaire (structure) ne sert qu'au squelette : il y a des fiches.
      expect(result.data.keptUnits.map((u) => u.id)).toEqual([
        'u0003',
        'u0004',
      ]);
      expect(result.data.discardedCount).toBe(2);
      expect(result.data.tokens.totalTokens).toBe(30);
    }
  });

  it('garde un tableau récapitulatif quand le document n’a pas de fiches', async () => {
    const { llm } = llmRouting(() => [{ index: 0, type: 'structure' }]);

    const result = await scoutUnits(llm, {
      units: [unit('Tableau : Axe 1, action A, pilote X', 'section')],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keptUnits).toHaveLength(1);
    }
  });

  it('garde, malgré les fiches, le récapitulatif qui numérote plus d’actions qu’elles', async () => {
    const recap = (numbers: number[]) =>
      buildUnit(
        numbers.map((number) => ({
          text: `Action à engager ${number} : Mener l'action ${number}`,
          pageIndex: 0,
        })),
        [],
        'section'
      );
    const fiches = [
      unit('Action 5 : Mener l’action 5. Pilote : Service', 'fiche'),
      unit('Action 6 : Mener l’action 6. Pilote : Service', 'fiche'),
    ];
    // Le tri n'a vu que l'introduction du tableau : il le dit hors sujet.
    const allStructure = (call: Call) =>
      [...call.prompt.matchAll(/#(\d+) \|/g)].map((m) => ({
        index: Number(m[1]),
        type: Number(m[1]) === 0 ? 'autre' : 'structure',
      }));

    const more = await scoutUnits(llmRouting(allStructure).llm, {
      units: numberUnits([recap([1, 2, 3, 4, 5, 6]), ...fiches]),
    });
    const same = await scoutUnits(llmRouting(allStructure).llm, {
      units: numberUnits([recap([5, 6]), ...fiches]),
    });

    expect(more.success && more.data.keptUnits.map((u) => u.id)).toEqual([
      'u0001',
      'u0002',
      'u0003',
    ]);
    expect(same.success && same.data.keptUnits.map((u) => u.id)).toEqual([
      'u0002',
      'u0003',
    ]);
  });

  it('compte une fiche découpée en fenêtres comme une seule fiche', async () => {
    const recap = (numbers: number[]) =>
      buildUnit(
        numbers.map((number) => ({
          text: `Action à engager ${number} : Mener l'action ${number}`,
          pageIndex: 0,
        })),
        [],
        'section'
      );
    const windowed = (number: number) => [
      unit(
        `Action ${number} : Mener l’action ${number}. Pilote : Service`,
        'fiche'
      ),
      buildUnit([{ text: 'Suite de la fiche', pageIndex: 1 }], [], 'fiche', {
        continued: true,
      }),
    ];
    const fiches = [...windowed(5), ...windowed(6)];
    const allStructure = (call: Call) =>
      [...call.prompt.matchAll(/#(\d+) \|/g)].map((m) => ({
        index: Number(m[1]),
        type: Number(m[1]) === 0 ? 'autre' : 'structure',
      }));

    const more = await scoutUnits(llmRouting(allStructure).llm, {
      units: numberUnits([recap([1, 2, 3, 4, 5, 6]), ...fiches]),
    });
    const same = await scoutUnits(llmRouting(allStructure).llm, {
      units: numberUnits([recap([5, 6]), ...fiches]),
    });

    expect(more.success && more.data.keptUnits[0].id).toBe('u0001');
    expect(same.success && same.data.keptUnits[0].id).toBe('u0002-1');
  });

  it('sans les actions dépourvues de fiche, donne leur récapitulatif au squelette seul, même trié fiche_action', async () => {
    const recap = buildUnit(
      [1, 2, 3, 4, 5, 6].map((number) => ({
        text: `Action à engager ${number} : Mener l'action ${number}`,
        pageIndex: 0,
      })),
      [],
      'table'
    );
    const fiches = [
      unit('Action 5 : Mener l’action 5. Pilote : Service', 'fiche', ['1 Axe']),
      unit('Action 6 : Mener l’action 6. Pilote : Service', 'fiche', ['1 Axe']),
    ];
    const allFicheAction = (call: Call) =>
      [...call.prompt.matchAll(/#(\d+) \|/g)].map((m) => ({
        index: Number(m[1]),
        type: 'fiche_action',
      }));
    const scout = (actionsWithoutFiche?: 'all' | 'with-fiche') => {
      const routing = llmRouting(allFicheAction);
      return scoutUnits(routing.llm, {
        units: numberUnits([recap, ...fiches]),
        actionsWithoutFiche,
      }).then((result) => ({ result, calls: routing.calls }));
    };
    const skeletonPromptOf = (calls: Call[]) =>
      calls.find((call) => !call.prompt.includes('agent de tri documentaire'))
        ?.prompt ?? '';

    const withFiche = await scout('with-fiche');
    const all = await scout('all');
    const byDefault = await scout();

    expect(
      withFiche.result.success &&
        withFiche.result.data.keptUnits.map((u) => u.id)
    ).toEqual(['u0002', 'u0003']);
    expect(
      withFiche.result.success && withFiche.result.data.discardedCount
    ).toBe(1);
    expect(skeletonPromptOf(withFiche.calls)).toContain(
      "Action à engager 1 : Mener l'action 1"
    );
    for (const { result, calls } of [all, byDefault]) {
      expect(result.success && result.data.keptUnits.map((u) => u.id)).toEqual([
        'u0001',
        'u0002',
        'u0003',
      ]);
      expect(skeletonPromptOf(calls)).not.toContain(
        "Action à engager 1 : Mener l'action 1"
      );
    }
  });

  it.each([
    [
      'PLAN D’ACTIONS À 2030',
      ['Action 1 : A', 'Action 2 : B', 'Action 3 : C'],
      2,
    ],
    [
      'FICHES PROJETS',
      ['Action 1 : A', 'Action 2 : B', 'Action 3 : C', 'Fiche 7 | indicateur'],
      1,
    ],
    [
      'Feuille de route',
      ['Action 1 : A', 'Action 2 : B', 'Action 3 : C', 'Fiche 7 | indicateur'],
      1,
    ],
  ])(
    'ne lit que la partie actions quand elle est titrée et contient des fiches : %s',
    async (plan, kept, discarded) => {
      const { llm, calls } = llmRouting((call) =>
        [...call.prompt.matchAll(/#(\d+) \|/g)].map((m) => ({
          index: Number(m[1]),
          type: 'fiche_action',
        }))
      );

      const result = await scoutUnits(llm, {
        units: [
          unit('Levier : planter des arbres', 'section', [], 'STRATÉGIE'),
          unit('Action 1 : A', 'fiche', [], plan),
          unit('Action 2 : B', 'fiche', [], plan),
          unit('Action 3 : C', 'fiche', [], plan),
          unit('Fiche 7 | indicateur', 'fiche', [], 'ANNEXES'),
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Une feuille de route ou des fiches projets n'excluent pas les
        // fiches rangées ailleurs.
        expect(result.data.keptUnits.map((u) => u.text)).toEqual(kept);
        expect(result.data.discardedCount).toBe(discarded);
      }
      expect(calls[0].prompt).not.toContain('planter des arbres');
    }
  );

  it('donne au squelette le sommaire placé avant la partie actions, même coupé en deux colonnes', async () => {
    const summaryPart = (lines: string[]) =>
      buildUnit(
        lines.map((text) => ({ text, pageIndex: 0 })),
        [],
        'section',
        { section: 'L’ESSENTIEL' }
      );
    const fiche = (title: string) =>
      buildUnit(
        [
          { text: `Action ${title}`, pageIndex: 2 },
          { text: 'Pilote : Service déchets', pageIndex: 2 },
        ],
        [],
        'fiche',
        { section: 'LES FICHES ACTIONS', title }
      );
    const { llm, calls } = llmRouting(() => []);

    await scoutUnits(llm, {
      units: numberUnits([
        summaryPart([
          '14 ACTIONS PRIORITAIRES',
          'BIODÉCHETS : RESTES ALIMENTAIRES ET VÉGÉTAUX',
          '1. Organiser le compostage individuel',
        ]),
        summaryPart([
          '2. Lutter contre le gaspillage alimentaire',
          'DÉCHETS EN MER',
          '3. Soutenir la lutte contre les déchets en mer',
        ]),
        unit(
          'La prévention des déchets réduit leur nocivité.',
          'section',
          [],
          'LE CONTEXTE'
        ),
        fiche('1 Organiser le compostage individuel'),
        fiche('2 Lutter contre le gaspillage alimentaire'),
        fiche('3 Soutenir la lutte contre les déchets en mer'),
      ]),
    });

    const skeletonPrompt = calls.find(
      (call) => !call.prompt.includes('agent de tri documentaire')
    )?.prompt;
    expect(skeletonPrompt).toContain(
      'BIODÉCHETS : RESTES ALIMENTAIRES ET VÉGÉTAUX'
    );
    expect(skeletonPrompt).toContain('DÉCHETS EN MER');
    expect(skeletonPrompt).not.toContain('réduit leur nocivité');
  });

  it('lit tout plutôt que rien quand le tri écarte toutes les unités', async () => {
    const only = [unit('Diagnostic', 'unknown'), unit('Contexte', 'unknown')];
    const { llm } = llmRouting(() => [
      { index: 0, type: 'diagnostic' },
      { index: 1, type: 'autre' },
    ]);

    const result = await scoutUnits(llm, { units: only });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keptUnits).toHaveLength(2);
      expect(result.data.discardedCount).toBe(0);
    }
  });

  it('lit tout, sans squelette, quand le modèle ne sait ni trier ni relever la structure', async () => {
    const llm = {
      generateStructured: vi.fn(async () => failure({ kind: 'rate_limited' })),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await scoutUnits(llm, { units });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keptUnits).toHaveLength(units.length);
      expect(result.data.skeleton).toBeNull();
      expect(result.data.warnings).toEqual([
        'Tri non fait pour les extraits 1 à 4 : rate_limited',
        'Squelette du plan non relevé : rate_limited',
      ]);
    }
  });

  it('retente un lot au JSON invalide avant de renoncer à le trier', async () => {
    let classifyCalls = 0;
    const llm = {
      generateStructured: vi.fn(async (call: Call) => {
        if (!call.prompt.includes('agent de tri documentaire')) {
          return success({ data: { axes: [] }, tokens });
        }
        classifyCalls += 1;
        return classifyCalls === 1
          ? failure({
              kind: 'invalid_json',
              rawTextLength: 10,
              schemaIssue: { path: [0, 'type'], code: 'invalid_value' },
            })
          : success({ data: [{ index: 1, type: 'diagnostic' }], tokens });
      }),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await scoutUnits(llm, { units });

    expect(classifyCalls).toBe(2);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discardedCount).toBe(1);
      expect(result.data.warnings).toEqual([]);
    }
  });
});

describe('le doute du modèle, rendu avec le squelette', () => {
  const diagnostic = numberUnits([
    unit('SYNTHÈSE DES ENJEUX', 'section'),
    unit('Le territoire compte 12 000 habitants et émet 80 ktCO2.', 'section', [
      'Synthèse des enjeux',
    ]),
  ]);
  const AXES = [{ numero: '1', titre: 'Enjeux', sousAxes: [] }];
  // Comme le service : la réponse brute passe par le schéma demandé.
  const parsingLlm = (skeletonAnswer: unknown) =>
    llmRouting(
      () => [
        { index: 0, type: 'diagnostic' },
        { index: 1, type: 'diagnostic' },
      ],
      (call) => {
        const parsed = parseStructuredResponse({
          completed: true,
          text: JSON.stringify(skeletonAnswer),
          schema: call.schema as typeof skeletonResponseSchema,
        });
        if (!parsed.success) throw new Error(parsed.error.kind);
        return parsed.data;
      }
    );

  it.each([
    ['un motif inconnu', { motif: 'autre', citations: [], explication: '' }],
    ['sans citations', { motif: 'aucune-action', explication: 'x' }],
    ['du texte', 'je doute'],
  ])(
    'un doute mal formé (%s) ne fait jamais échouer le squelette',
    async (_label, doute) => {
      const { llm } = parsingLlm({ axes: AXES, doute });

      const result = await extractSkeleton(llm, {
        units: diagnostic,
        structureUnits: [],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skeleton?.axes).toEqual(AXES);
        expect(result.data.modelDoubt).toBeNull();
      }
    }
  );

  it('demande le doute au modèle, null quand il n’y en a pas', async () => {
    const { llm, calls } = parsingLlm({ axes: AXES });

    const result = await extractSkeleton(llm, {
      units: diagnostic,
      structureUnits: [],
    });

    expect(calls[0].prompt).toContain('"doute": null');
    expect(result.success && result.data.modelDoubt).toBeNull();
  });

  it('s’arrête après le squelette quand le doute est vérifié et confirmé', async () => {
    const { llm } = parsingLlm({
      axes: AXES,
      doute: {
        motif: 'aucune-action',
        citations: ['« Synthèse des enjeux »'],
        explication: 'Un diagnostic, sans action.',
      },
    });

    const result = await scoutUnits(llm, { units: diagnostic });

    expect(result).toEqual(
      failure({
        kind: 'analysis_abandoned',
        motif: 'aucune-action',
        evidence: [{ citation: 'Synthèse des enjeux', page: 1 }],
        explanation: 'Un diagnostic, sans action.',
      })
    );
  });

  it('continue, en le notant, quand une citation est introuvable', async () => {
    const { llm } = parsingLlm({
      axes: AXES,
      doute: {
        motif: 'aucune-action',
        citations: [
          'Synthèse des enjeux',
          'Un passage inventé de toutes pièces',
        ],
        explication: 'Un diagnostic.',
      },
    });

    const result = await scoutUnits(llm, { units: diagnostic });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skeleton?.axes).toEqual(AXES);
      expect(result.data.warnings).toEqual([
        'Doute du modèle « aucune-action » écarté : citation introuvable dans le document',
      ]);
      expect(result.data.details).toEqual({
        'modelDoubt:aucune-action': 1,
        modelDoubtVerified: 0,
        modelDoubtConfirmed: 0,
      });
    }
  });

  it('ne s’arrête pas sur des grilles concurrentes quand l’utilisateur a tranché les thèmes', async () => {
    const doute = {
      motif: 'grilles-concurrentes',
      citations: ['Synthèse des enjeux'],
      explication: 'Deux grilles.',
    };

    const unanswered = await scoutUnits(parsingLlm({ axes: AXES, doute }).llm, {
      units: diagnostic,
    });
    const answered = await scoutUnits(parsingLlm({ axes: AXES, doute }).llm, {
      units: diagnostic,
      themeGrouping: { grouping: 'grouped', groups: [] },
    });

    expect(unanswered.success).toBe(false);
    expect(answered.success).toBe(true);
  });
});
