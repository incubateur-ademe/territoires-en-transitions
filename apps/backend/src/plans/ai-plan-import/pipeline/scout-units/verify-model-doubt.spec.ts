import { describe, expect, it } from 'vitest';
import type { ModelDoubt } from '../../models/model-doubt';
import {
  buildUnit,
  type DocumentUnit,
  numberUnits,
} from '../segment-document/document-unit';
import {
  type DoubtFacts,
  findDoubtEvidence,
  judgeModelDoubt,
  MAX_EXPLANATION_LENGTH,
} from './verify-model-doubt';

const unit = (
  lines: { text: string; page: number }[],
  kind: DocumentUnit['kind'] = 'section'
) =>
  buildUnit(
    lines.map(({ text, page }) => ({ text, pageIndex: page - 1 })),
    [],
    kind
  );

const diagnostic = numberUnits([
  unit([
    { text: 'SYNTHÈSE DES ENJEUX', page: 40 },
    { text: 'Le territoire compte 12 000 habitants.', page: 40 },
  ]),
  unit([
    { text: 'Les émissions du secteur résidentiel', page: 41 },
    { text: 'représentent 38 % du total.', page: 41 },
  ]),
]);

const GARBLED = 'Pl@n d4ct1ons c0mmun@ut3';
const scanned = unit([{ text: `${GARBLED} ~~ l3s m3sur#s`, page: 7 }]);

const doubt = (overrides: Partial<ModelDoubt> = {}): ModelDoubt => ({
  motif: 'aucune-action',
  citations: ['Synthèse des enjeux'],
  explication: 'Le document est un diagnostic, sans action.',
  ...overrides,
});

const facts = (overrides: Partial<DoubtFacts> = {}): DoubtFacts => ({
  units: diagnostic,
  sortedAsFiche: false,
  sortingFailed: false,
  themeGroupingAnswered: false,
  actionsReadByCode: 0,
  ...overrides,
});

describe('findDoubtEvidence', () => {
  it('retrouve chaque citation à sa page, sans accents, casse ni ponctuation, y compris sur deux lignes', () => {
    expect(
      findDoubtEvidence(
        ['« Synthese des enjeux »', 'secteur résidentiel représentent 38 %'],
        diagnostic
      )
    ).toEqual([
      { citation: 'Synthese des enjeux', page: 40 },
      { citation: 'secteur résidentiel représentent 38 %', page: 41 },
    ]);
  });

  it('rejette le doute dès qu’une citation manque', () => {
    expect(
      findDoubtEvidence(
        ['Synthèse des enjeux', 'Programme d’actions 2026'],
        diagnostic
      )
    ).toBeNull();
  });

  it('ne retrouve que des mots entiers, et rejette une citation trop courte ou absente', () => {
    expect(findDoubtEvidence(['ynthèse des enjeu'], diagnostic)).toBeNull();
    expect(findDoubtEvidence(['enjeux'], diagnostic)).toBeNull();
    expect(findDoubtEvidence([], diagnostic)).toBeNull();
    expect(findDoubtEvidence(['  « »  '], diagnostic)).toBeNull();
  });

  it('ne lit que les 4 premières citations', () => {
    expect(
      findDoubtEvidence(
        [
          ...Array.from({ length: 4 }, () => 'Synthèse des enjeux'),
          'Introuvable dans le document',
        ],
        diagnostic
      )
    ).toHaveLength(4);
  });
});

describe('judgeModelDoubt', () => {
  it('abandonne « aucune action » vérifié et confirmé : ni fiche, ni tableau, ni action numérotée, tri sans fiche', () => {
    const judgement = judgeModelDoubt(doubt(), facts());

    expect(judgement).toEqual({
      abandon: {
        kind: 'analysis_abandoned',
        motif: 'aucune-action',
        evidence: [{ citation: 'Synthèse des enjeux', page: 40 }],
        explanation: 'Le document est un diagnostic, sans action.',
      },
      warning: null,
      details: {
        'modelDoubt:aucune-action': 1,
        modelDoubtVerified: 1,
        modelDoubtConfirmed: 1,
      },
    });
  });

  it('ignore un doute aux citations introuvables, et le note', () => {
    const judgement = judgeModelDoubt(
      doubt({ citations: ['Plan climat air énergie de la commune B'] }),
      facts()
    );

    expect(judgement.abandon).toBeNull();
    expect(judgement.warning).toContain('citation introuvable');
    expect(judgement.details).toMatchObject({
      modelDoubtVerified: 0,
      modelDoubtConfirmed: 0,
    });
  });

  const fiches = Array.from({ length: 20 }, (_, index) =>
    unit([{ text: `Action ${index + 1} Isoler l’école`, page: 50 }], 'fiche')
  );
  it.each([
    ['20 fiches', { units: [...diagnostic, ...fiches] }],
    [
      'un tableau',
      {
        units: [
          ...diagnostic,
          unit([{ text: 'Isoler | 2026', page: 42 }], 'table'),
        ],
      },
    ],
    [
      '3 actions numérotées',
      {
        units: [
          ...diagnostic,
          unit(
            [1, 2, 3].map((numero) => ({
              text: `Action ${numero} : Isoler le bâtiment ${numero}`,
              page: 42,
            }))
          ),
        ],
      },
    ],
    ['une fiche action vue par le tri', { sortedAsFiche: true }],
    ['un lot du tri en échec', { sortingFailed: true }],
    ['des actions lues par le code', { actionsReadByCode: 4 }],
  ] satisfies [string, Partial<DoubtFacts>][])(
    'ne confirme pas « aucune action » avec %s',
    (_label, overrides) => {
      const judgement = judgeModelDoubt(doubt(), facts(overrides));

      expect(judgement.abandon).toBeNull();
      expect(judgement.warning).toContain('non confirmé');
      expect(judgement.details).toMatchObject({
        modelDoubtVerified: 1,
        modelDoubtConfirmed: 0,
      });
    }
  );

  it.each([
    [35, true],
    [16, false],
  ])(
    'confirme un texte illisible à partir de 30 %% des pages : %i %% → %s',
    (unreadablePages, abandons) => {
      const readingStats = { pageCount: 100, unreadablePages };
      const judgement = judgeModelDoubt(
        doubt({ motif: 'texte-illisible', citations: [GARBLED] }),
        facts({
          readingStats,
          units: [...diagnostic, ...fiches.slice(0, 2), scanned],
        })
      );

      expect(judgement.abandon).toEqual(
        abandons
          ? expect.objectContaining({
              motif: 'texte-illisible',
              readingStats,
            })
          : null
      );
    }
  );

  it('ne confirme pas un texte illisible quand des fiches ont été lues en nombre', () => {
    expect(
      judgeModelDoubt(
        doubt({ motif: 'texte-illisible', citations: [GARBLED] }),
        facts({
          readingStats: { pageCount: 100, unreadablePages: 40 },
          units: [...diagnostic, ...fiches, scanned],
        })
      ).abandon
    ).toBeNull();
  });

  it('ne met pas les mots du modèle dans l’avertissement', () => {
    const { warning } = judgeModelDoubt(
      doubt({
        motif: 'plusieurs-plans',
        citations: ['une phrase absente du document'],
        explication: 'Le plan de Clisson et celui de Lyon',
      }),
      facts({ units: diagnostic })
    );
    expect(warning).not.toContain('Clisson');
  });

  it('ne confirme pas un texte illisible que ses propres citations montrent bien lu', () => {
    // Diaporama : couverture, intercalaires et remerciements courts, fiches
    // pleines. Même compté illisible, il se lit.
    const slides = numberUnits([
      unit([{ text: 'PLAN MOBILITÉ 2025', page: 1 }]),
      unit(
        [
          { text: 'Développer des stationnements vélos sécurisés', page: 3 },
          { text: 'Pilote : service mobilité', page: 3 },
        ],
        'fiche'
      ),
    ]);
    const judgement = judgeModelDoubt(
      doubt({
        motif: 'texte-illisible',
        citations: ['Développer des stationnements vélos sécurisés'],
      }),
      facts({
        units: slides,
        readingStats: { pageCount: 10, unreadablePages: 5 },
      })
    );

    expect(judgement.abandon).toBeNull();
    expect(judgement.warning).toContain('non confirmé');
  });

  it('ne confirme pas un texte illisible sans compte des pages', () => {
    expect(
      judgeModelDoubt(
        doubt({ motif: 'texte-illisible', citations: [GARBLED] }),
        facts({ units: [...diagnostic, scanned] })
      ).abandon
    ).toBeNull();
  });

  it('abandonne « plusieurs plans » sur ses seules citations, même avec des fiches', () => {
    expect(
      judgeModelDoubt(
        doubt({ motif: 'plusieurs-plans' }),
        facts({ units: [...diagnostic, ...fiches], sortedAsFiche: true })
      ).abandon
    ).toMatchObject({ motif: 'plusieurs-plans' });
  });

  it('abandonne des grilles concurrentes, sauf quand l’utilisateur a tranché les thèmes', () => {
    const grilles = doubt({ motif: 'grilles-concurrentes' });

    expect(judgeModelDoubt(grilles, facts()).abandon).toMatchObject({
      motif: 'grilles-concurrentes',
    });
    const answered = judgeModelDoubt(
      grilles,
      facts({ themeGroupingAnswered: true })
    );
    expect(answered.abandon).toBeNull();
    expect(answered.warning).toContain('non confirmé');
  });

  it('coupe l’explication du modèle', () => {
    const judgement = judgeModelDoubt(
      doubt({ explication: 'mot '.repeat(200) }),
      facts()
    );

    const explanation = judgement.abandon?.explanation ?? '';
    expect(explanation.length).toBeLessThanOrEqual(MAX_EXPLANATION_LENGTH);
    expect(explanation.endsWith('mot…')).toBe(true);
  });
});
