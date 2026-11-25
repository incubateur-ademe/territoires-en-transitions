import type {
  IndicateurTotal,
  IndicateurTotalAtDate,
} from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import { buildSousIndicateursChartData } from './sous-indicateurs-chart.rules';
import {
  buildSousIndicateursTableData,
  type SousIndicateurDatedValeur,
  type SousIndicateurNode,
} from './sous-indicateurs-table.rules';

const ROOT_ID = 1;
const COLLECTES_ID = 2;
const VERRE_ID = 3;
const EMBALLAGES_ID = 4;
const PAPIER_ID = 5;

const NO_OBJECTIF: IndicateurTotal = {
  status: 'incomplete',
  filledCount: 0,
  expectedCount: 2,
};

const toNode = ({
  id,
  label,
  enfantIds = [],
}: {
  id: number;
  label: string;
  enfantIds?: readonly number[];
}): SousIndicateurNode => ({ id, label, enfantIds });

const toComplete = (valeur: number): IndicateurTotal => ({
  status: 'complete',
  valeur,
});

const toTotalAtDate = ({
  dateValeur,
  resultat,
  objectif = NO_OBJECTIF,
}: {
  dateValeur: string;
  resultat: IndicateurTotal;
  objectif?: IndicateurTotal;
}): IndicateurTotalAtDate => ({ dateValeur, resultat, objectif });

const toResultat = (
  dateValeur: string,
  resultat: number | null
): SousIndicateurDatedValeur => ({ dateValeur, resultat, objectif: null });

const NODES = [
  toNode({
    id: ROOT_ID,
    label: 'Déchets',
    enfantIds: [VERRE_ID, COLLECTES_ID],
  }),
  toNode({ id: VERRE_ID, label: 'Verre' }),
  toNode({
    id: COLLECTES_ID,
    label: 'Collectes sélectives',
    enfantIds: [EMBALLAGES_ID, PAPIER_ID],
  }),
  toNode({ id: EMBALLAGES_ID, label: 'Emballages' }),
  toNode({ id: PAPIER_ID, label: 'Papier' }),
];

const toSource = ({
  nodes = NODES,
  valeurs = [],
  totals = [],
}: {
  nodes?: readonly SousIndicateurNode[];
  valeurs?: readonly (readonly [
    number,
    readonly SousIndicateurDatedValeur[]
  ])[];
  totals?: readonly (readonly [number, readonly IndicateurTotalAtDate[]])[];
}) => ({
  rootId: ROOT_ID,
  nodesById: new Map(nodes.map((node) => [node.id, node])),
  valeursByIndicateurId: new Map(valeurs),
  totalsByIndicateurId: new Map(totals),
});

const FULL_VALEURS = [
  [EMBALLAGES_ID, [toResultat('2022-01-01', 10), toResultat('2023-01-01', 12)]],
  [PAPIER_ID, [toResultat('2022-01-01', 5), toResultat('2023-01-01', 6)]],
  [VERRE_ID, [toResultat('2022-01-01', 3), toResultat('2023-01-01', 4)]],
] as const;

const ROOT_TOTALS = [
  toTotalAtDate({ dateValeur: '2022-01-01', resultat: toComplete(18) }),
  toTotalAtDate({ dateValeur: '2023-01-01', resultat: toComplete(22) }),
];

const COLLECTES_CONSOLIDATED_TOTALS = [
  toTotalAtDate({ dateValeur: '2022-01-01', resultat: toComplete(15) }),
  toTotalAtDate({ dateValeur: '2023-01-01', resultat: toComplete(18) }),
];

describe('buildSousIndicateursChartData', () => {
  describe('empilement des enfants directs', () => {
    it("empile les enfants directs dans l'ordre de création, un niveau intermédiaire par son total consolidé", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: FULL_VALEURS,
          totals: [
            [ROOT_ID, ROOT_TOTALS],
            [COLLECTES_ID, COLLECTES_CONSOLIDATED_TOTALS],
          ],
        })
      );

      expect(data).toMatchObject({
        dates: ['2022-01-01', '2023-01-01'],
      });
      expect(
        data?.children.map(({ indicateurId, label, valeurs }) => ({
          indicateurId,
          label,
          valeurs,
        }))
      ).toEqual([
        {
          indicateurId: COLLECTES_ID,
          label: 'Collectes sélectives',
          valeurs: [15, 18],
        },
        { indicateurId: VERRE_ID, label: 'Verre', valeurs: [3, 4] },
      ]);
    });

    it('trace un niveau intermédiaire par son total consolidé et pas par ses valeurs propres', () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: [
            ...FULL_VALEURS,
            [COLLECTES_ID, [toResultat('2022-01-01', 999)]],
          ],
          totals: [
            [ROOT_ID, ROOT_TOTALS],
            [COLLECTES_ID, COLLECTES_CONSOLIDATED_TOTALS],
          ],
        })
      );

      expect(
        data?.children.map(({ label, valeurs }) => [label, valeurs])
      ).toEqual([
        ['Collectes sélectives', [15, 18]],
        ['Verre', [3, 4]],
      ]);
    });

    it("trace un niveau intermédiaire par ses valeurs propres quand aucun total n'a été calculé pour lui", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: [
            ...FULL_VALEURS,
            [
              COLLECTES_ID,
              [toResultat('2022-01-01', 20), toResultat('2023-01-01', 22)],
            ],
          ],
        })
      );

      expect(
        data?.children.map(({ label, valeurs }) => [label, valeurs])
      ).toEqual([
        ['Collectes sélectives', [20, 22]],
        ['Verre', [3, 4]],
      ]);
    });

    it("ne trace pas les sous-indicateurs d'un enfant direct", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: FULL_VALEURS,
          totals: [
            [ROOT_ID, ROOT_TOTALS],
            [COLLECTES_ID, COLLECTES_CONSOLIDATED_TOTALS],
          ],
        })
      );

      expect(data?.children.map(({ label }) => label)).not.toContain(
        'Emballages'
      );
      expect(data?.children.map(({ label }) => label)).not.toContain('Papier');
    });

    it("aligne chaque série sur l'union triée des dates, avec un trou pour une date absente", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: [
            [
              VERRE_ID,
              [toResultat('2022-01-01', 3), toResultat('2024-01-01', 8)],
            ],
          ],
          totals: [
            [ROOT_ID, []],
            [
              COLLECTES_ID,
              [
                toTotalAtDate({
                  dateValeur: '2023-01-01',
                  resultat: toComplete(12),
                }),
              ],
            ],
          ],
        })
      );

      expect(data).toMatchObject({
        dates: ['2022-01-01', '2023-01-01', '2024-01-01'],
      });
      expect(
        data?.children.map(({ label, valeurs }) => [label, valeurs])
      ).toEqual([
        ['Collectes sélectives', [null, 12, null]],
        ['Verre', [3, null, 8]],
      ]);
    });

    it("garde une date dont la valeur de l'enfant est absente comme trou entre deux dates renseignées", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: [
            [
              VERRE_ID,
              [
                toResultat('2022-01-01', 10),
                toResultat('2023-01-01', null),
                toResultat('2024-01-01', 12),
              ],
            ],
          ],
          totals: [[ROOT_ID, []]],
        })
      );

      expect(data).toMatchObject({
        dates: ['2022-01-01', '2023-01-01', '2024-01-01'],
      });
      expect(data?.children.map(({ valeurs }) => valeurs)).toEqual([
        [10, null, 12],
      ]);
    });

    it('trace le total du résultat là où il est complet et laisse un trou ailleurs', () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: FULL_VALEURS,
          totals: [
            [
              ROOT_ID,
              [
                toTotalAtDate({
                  dateValeur: '2022-01-01',
                  resultat: {
                    status: 'incomplete',
                    filledCount: 2,
                    expectedCount: 3,
                  },
                }),
                toTotalAtDate({
                  dateValeur: '2023-01-01',
                  resultat: toComplete(22),
                }),
              ],
            ],
          ],
        })
      );

      expect(data?.resultatTotal).toEqual([null, 22]);
    });

    it('trace le total des objectifs quand il est complet', () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: FULL_VALEURS,
          totals: [
            [
              ROOT_ID,
              [
                toTotalAtDate({
                  dateValeur: '2022-01-01',
                  resultat: toComplete(18),
                  objectif: toComplete(30),
                }),
                toTotalAtDate({
                  dateValeur: '2023-01-01',
                  resultat: toComplete(22),
                }),
              ],
            ],
          ],
        })
      );

      expect(data?.objectifTotal).toEqual([30, null]);
    });

    it('ne trace pas de courbe du total quand il est masqué à toutes les dates', () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: FULL_VALEURS,
          totals: [
            [
              ROOT_ID,
              [
                toTotalAtDate({
                  dateValeur: '2022-01-01',
                  resultat: { status: 'hidden' },
                }),
                toTotalAtDate({
                  dateValeur: '2023-01-01',
                  resultat: { status: 'hidden' },
                }),
              ],
            ],
            [COLLECTES_ID, COLLECTES_CONSOLIDATED_TOTALS],
          ],
        })
      );

      expect(data?.resultatTotal).toBeNull();
      expect(data?.children).toHaveLength(2);
    });

    it("omet un enfant direct qui n'a aucun résultat", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: [[VERRE_ID, [toResultat('2022-01-01', 3)]]],
          totals: [
            [ROOT_ID, []],
            [
              COLLECTES_ID,
              [
                toTotalAtDate({
                  dateValeur: '2022-01-01',
                  resultat: {
                    status: 'incomplete',
                    filledCount: 1,
                    expectedCount: 2,
                  },
                }),
              ],
            ],
          ],
        })
      );

      expect(data?.children.map(({ label }) => label)).toEqual(['Verre']);
    });

    it("ne renvoie rien quand aucune valeur ni aucun total n'est renseigné", () => {
      expect(
        buildSousIndicateursChartData(toSource({ totals: [[ROOT_ID, []]] }))
      ).toBeNull();
    });

    it("suit l'ordre de création des enfants directs, pas celui de leur liste", () => {
      const ZINC_ID = 6;
      const data = buildSousIndicateursChartData(
        toSource({
          nodes: [
            toNode({
              id: ROOT_ID,
              label: 'Déchets',
              enfantIds: [ZINC_ID, COLLECTES_ID],
            }),
            toNode({ id: COLLECTES_ID, label: 'Collectes sélectives' }),
            toNode({ id: ZINC_ID, label: 'Zinc' }),
          ],
          valeurs: [
            [ZINC_ID, [toResultat('2022-01-01', 2)]],
            [COLLECTES_ID, [toResultat('2022-01-01', 5)]],
          ],
          totals: [[ROOT_ID, []]],
        })
      );

      expect(data?.children.map(({ label }) => label)).toEqual([
        'Collectes sélectives',
        'Zinc',
      ]);
    });

    it("n'empile qu'une fois un enfant direct listé deux fois", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          nodes: [
            toNode({
              id: ROOT_ID,
              label: 'Déchets',
              enfantIds: [VERRE_ID, VERRE_ID],
            }),
            toNode({ id: VERRE_ID, label: 'Verre' }),
          ],
          valeurs: [[VERRE_ID, [toResultat('2022-01-01', 3)]]],
          totals: [[ROOT_ID, []]],
        })
      );

      expect(
        data?.children.map(({ indicateurId, valeurs }) => [
          indicateurId,
          valeurs,
        ])
      ).toEqual([[VERRE_ID, [3]]]);
    });

    it("termine sur un cycle et trace une seule fois l'enfant direct qu'il traverse", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          nodes: [
            toNode({ id: ROOT_ID, label: 'Racine', enfantIds: [COLLECTES_ID] }),
            toNode({
              id: COLLECTES_ID,
              label: 'Collectes sélectives',
              enfantIds: [VERRE_ID, ROOT_ID, COLLECTES_ID],
            }),
            toNode({ id: VERRE_ID, label: 'Verre' }),
          ],
          valeurs: [[VERRE_ID, [toResultat('2022-01-01', 3)]]],
          totals: [
            [ROOT_ID, []],
            [
              COLLECTES_ID,
              [
                toTotalAtDate({
                  dateValeur: '2022-01-01',
                  resultat: toComplete(3),
                }),
              ],
            ],
          ],
        })
      );

      expect(
        data?.children.map(({ indicateurId, valeurs }) => [
          indicateurId,
          valeurs,
        ])
      ).toEqual([[COLLECTES_ID, [3]]]);
    });

    it('termine sur un cycle sans valeur à tracer', () => {
      expect(
        buildSousIndicateursChartData(
          toSource({
            nodes: [
              toNode({ id: ROOT_ID, label: 'Racine', enfantIds: [VERRE_ID] }),
              toNode({ id: VERRE_ID, label: 'Verre', enfantIds: [ROOT_ID] }),
            ],
            valeurs: [[VERRE_ID, [toResultat('2022-01-01', 3)]]],
            totals: [
              [ROOT_ID, []],
              [VERRE_ID, []],
            ],
          })
        )
      ).toBeNull();
    });

    it("ne renvoie rien quand la racine est absente de l'arbre", () => {
      expect(
        buildSousIndicateursChartData(
          toSource({ nodes: [], totals: [[ROOT_ID, []]] })
        )
      ).toBeNull();
    });

    it("trace les objectifs seuls quand aucun enfant direct n'a de résultat", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          totals: [
            [
              ROOT_ID,
              [
                toTotalAtDate({
                  dateValeur: '2022-01-01',
                  resultat: NO_OBJECTIF,
                  objectif: toComplete(30),
                }),
              ],
            ],
          ],
        })
      );

      expect(data).toEqual({
        dates: ['2022-01-01'],
        children: [],
        resultatTotal: null,
        objectifTotal: [30],
      });
    });

    it("empile encore quand le total du résultat est masqué mais que l'objectif reste additif", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: [[VERRE_ID, [toResultat('2022-01-01', 3)]]],
          totals: [
            [
              ROOT_ID,
              [
                toTotalAtDate({
                  dateValeur: '2022-01-01',
                  resultat: { status: 'hidden' },
                  objectif: toComplete(30),
                }),
              ],
            ],
          ],
        })
      );

      expect(data).not.toBeNull();
    });
  });

  describe('couleurs', () => {
    const toTableColors = (source: ReturnType<typeof toSource>) =>
      new Map(
        buildSousIndicateursTableData(source).rows.map(
          ({ indicateurId, color }) => [indicateurId, color]
        )
      );

    it('colore chaque enfant direct empilé comme sa ligne du tableau', () => {
      const source = toSource({
        valeurs: FULL_VALEURS,
        totals: [
          [
            ROOT_ID,
            [
              toTotalAtDate({
                dateValeur: '2022-01-01',
                resultat: toComplete(1),
              }),
            ],
          ],
          [COLLECTES_ID, COLLECTES_CONSOLIDATED_TOTALS],
        ],
      });
      const data = buildSousIndicateursChartData(source);
      const tableColors = toTableColors(source);

      expect(data?.children.length).toBeGreaterThan(1);
      expect(
        data?.children.map(({ indicateurId, color }) => [indicateurId, color])
      ).toEqual(
        data?.children.map(({ indicateurId }) => [
          indicateurId,
          tableColors.get(indicateurId),
        ])
      );
    });
  });

  describe('quand deux sous-indicateurs portent le même titre', () => {
    const DUPLICATE_TITLE_NODES = [
      toNode({ id: ROOT_ID, label: 'Déchets', enfantIds: [10, 11] }),
      toNode({ id: 10, label: 'Verre' }),
      toNode({ id: 11, label: 'Verre' }),
    ];
    const DUPLICATE_TITLE_VALEURS = [
      [10, [toResultat('2022-01-01', 3)]],
      [11, [toResultat('2022-01-01', 4)]],
    ] as const;

    it('distingue leurs séries empilées par un nom distinct pour que la légende les sélectionne séparément', () => {
      const data = buildSousIndicateursChartData(
        toSource({
          nodes: DUPLICATE_TITLE_NODES,
          valeurs: DUPLICATE_TITLE_VALEURS,
          totals: [[ROOT_ID, ROOT_TOTALS]],
        })
      );

      expect(data?.children.map(({ label }) => label)).toEqual([
        'Verre',
        'Verre (2)',
      ]);
    });
  });
});
