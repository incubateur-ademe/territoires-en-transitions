import { describe, expect, it } from 'vitest';
import type { PlanSkeleton } from '../../models/plan-skeleton';
import type { DocumentUnit } from '../segment-document/document-unit';
import { keepCodeAxes } from './keep-code-axes';

const fiche = (
  title: string,
  headingPath: string[],
  extra: Partial<DocumentUnit> = {}
): DocumentUnit => ({
  id: '',
  lines: [],
  text: title,
  pageStart: 0,
  pageEnd: 0,
  headingPath,
  title,
  kind: 'fiche',
  tokenEstimate: 100,
  ...extra,
});

const BIODECHETS = 'BIODÉCHETS : RESTES ALIMENTAIRES ET VÉGÉTAUX';
const TRANSVERSAL = 'ACTIONS TRANSVERSALES - TOUS FLUX';
const units = [
  fiche('1 Organiser le compostage individuel', [BIODECHETS]),
  fiche('2 Organiser le compostage collectif', [BIODECHETS]),
  fiche('13 Sensibiliser au PLPDMA', [TRANSVERSAL]),
  fiche('14 Diffuser un plan de communication', [TRANSVERSAL]),
];

// La grille d'un guide national, croisée dans le document.
const guide: PlanSkeleton = {
  axes: [
    {
      numero: '1',
      titre: 'Être exemplaire en matière de prévention',
      sousAxes: [],
    },
    { numero: '6', titre: 'Gestion de proximité des biodéchets', sousAxes: [] },
    { numero: '8', titre: 'Renforcer les actions emblématiques', sousAxes: [] },
  ],
};

describe('keepCodeAxes', () => {
  it('remplace une grille étrangère par les axes du code, dans l’ordre du document', () => {
    expect(keepCodeAxes(guide, units)).toEqual({
      fromCode: true,
      skeleton: {
        axes: [
          { numero: '1', titre: BIODECHETS, sousAxes: [] },
          { numero: '2', titre: TRANSVERSAL, sousAxes: [] },
        ],
      },
    });
  });

  it('garde le squelette du modèle qui reprend les axes du code, même reformulés', () => {
    const skeleton: PlanSkeleton = {
      axes: [
        {
          numero: '1',
          titre: 'Biodéchets : restes alimentaires et végétaux',
          sousAxes: [{ numero: '1.1', titre: 'Compostage' }],
        },
        {
          numero: '2',
          titre: 'Actions transversales - tous flux',
          sousAxes: [],
        },
      ],
    };
    expect(keepCodeAxes(skeleton, units)).toEqual({
      skeleton,
      fromCode: false,
    });
  });

  it('garde le squelette du modèle quand une fiche n’a pas d’axe relevé', () => {
    expect(
      keepCodeAxes(guide, [...units, fiche('15 Une fiche hors axe', [])])
    ).toEqual({ skeleton: guide, fromCode: false });
  });

  it('reprend les numéros et les sous-axes du code', () => {
    const numbered = [
      fiche('1.1.1 Rénover les écoles', ['1 Sobriété', '1.1 Bâtiments']),
      fiche('1.2.1 Développer le vélo', ['1 Sobriété', '1.2 Mobilité']),
      fiche('2.1.1 Planter des haies', ['2 Biodiversité']),
      fiche('2.1.2 Restaurer les mares', ['2 Biodiversité'], {
        continued: true,
      }),
    ];
    expect(keepCodeAxes(guide, numbered).skeleton).toEqual({
      axes: [
        {
          numero: '1',
          titre: 'Sobriété',
          sousAxes: [
            { numero: '1.1', titre: 'Bâtiments' },
            { numero: '1.2', titre: 'Mobilité' },
          ],
        },
        { numero: '2', titre: 'Biodiversité', sousAxes: [] },
      ],
    });
  });
});
