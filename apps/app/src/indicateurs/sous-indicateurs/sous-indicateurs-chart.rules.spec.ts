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
const VERRE_ID = 2;
const COLLECTES_ID = 3;
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

const toNotAdditiveTotalAtDate = ({
  dateValeur,
  resultat = { status: 'not-additive' },
}: {
  dateValeur: string;
  resultat?: IndicateurTotal;
}): IndicateurTotalAtDate => ({
  dateValeur,
  resultat,
  objectif: { status: 'not-additive' },
});

const FULL_VALEURS = [
  [EMBALLAGES_ID, [toResultat('2022-01-01', 10), toResultat('2023-01-01', 12)]],
  [PAPIER_ID, [toResultat('2022-01-01', 5), toResultat('2023-01-01', 6)]],
  [VERRE_ID, [toResultat('2022-01-01', 3), toResultat('2023-01-01', 4)]],
] as const;

const CUMUL_CHECKED_ROOT_TOTALS = [
  toTotalAtDate({ dateValeur: '2022-01-01', resultat: toComplete(18) }),
  toTotalAtDate({ dateValeur: '2023-01-01', resultat: toComplete(22) }),
];

describe('buildSousIndicateursChartData', () => {
  describe('quand le cumul de la racine est coché', () => {
    it("empile les feuilles dans l'ordre des titres, sans empiler le niveau intermédiaire", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: FULL_VALEURS,
          totals: [[ROOT_ID, CUMUL_CHECKED_ROOT_TOTALS]],
        })
      );

      expect(data).toMatchObject({
        mode: 'stacked',
        dates: ['2022-01-01', '2023-01-01'],
      });
      expect(
        data?.mode === 'stacked' &&
          data.leaves.map(({ indicateurId, label, valeurs }) => ({
            indicateurId,
            label,
            valeurs,
          }))
      ).toEqual([
        { indicateurId: EMBALLAGES_ID, label: 'Emballages', valeurs: [10, 12] },
        { indicateurId: PAPIER_ID, label: 'Papier', valeurs: [5, 6] },
        { indicateurId: VERRE_ID, label: 'Verre', valeurs: [3, 4] },
      ]);
    });

    it("ne compte pas les valeurs propres d'un niveau intermédiaire parmi les feuilles", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: [
            ...FULL_VALEURS,
            [COLLECTES_ID, [toResultat('2022-01-01', 999)]],
          ],
          totals: [[ROOT_ID, CUMUL_CHECKED_ROOT_TOTALS]],
        })
      );

      expect(
        data?.mode === 'stacked' && data.leaves.map(({ label }) => label)
      ).toEqual(['Emballages', 'Papier', 'Verre']);
    });

    it("aligne chaque série sur l'union triée des dates, avec un trou pour une date absente", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: [
            [EMBALLAGES_ID, [toResultat('2023-01-01', 12)]],
            [
              VERRE_ID,
              [toResultat('2022-01-01', 3), toResultat('2024-01-01', 8)],
            ],
          ],
          totals: [[ROOT_ID, []]],
        })
      );

      expect(data).toMatchObject({
        dates: ['2022-01-01', '2023-01-01', '2024-01-01'],
      });
      expect(
        data?.mode === 'stacked' &&
          data.leaves.map(({ label, valeurs }) => [label, valeurs])
      ).toEqual([
        ['Emballages', [null, 12, null]],
        ['Verre', [3, null, 8]],
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

      expect(data?.mode === 'stacked' && data.resultatTotal).toEqual([
        null,
        22,
      ]);
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

      expect(data?.mode === 'stacked' && data.objectifTotal).toEqual([
        30,
        null,
      ]);
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
          ],
        })
      );

      expect(data?.mode === 'stacked' && data.resultatTotal).toBeNull();
      expect(data?.mode === 'stacked' && data.leaves).toHaveLength(3);
    });

    it("omet une feuille qui n'a aucun résultat", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: [
            [EMBALLAGES_ID, [toResultat('2022-01-01', null)]],
            [VERRE_ID, [toResultat('2022-01-01', 3)]],
          ],
          totals: [[ROOT_ID, []]],
        })
      );

      expect(
        data?.mode === 'stacked' && data.leaves.map(({ label }) => label)
      ).toEqual(['Verre']);
    });

    it("ne renvoie rien quand aucune valeur ni aucun total n'est renseigné", () => {
      expect(
        buildSousIndicateursChartData(toSource({ totals: [[ROOT_ID, []]] }))
      ).toBeNull();
    });

    it("suit l'ordre du parcours en profondeur du tableau, pas un tri global des feuilles", () => {
      const ZINC_ID = 6;
      const ALUMINIUM_ID = 7;
      const data = buildSousIndicateursChartData(
        toSource({
          nodes: [
            toNode({
              id: ROOT_ID,
              label: 'Déchets',
              enfantIds: [COLLECTES_ID, ZINC_ID],
            }),
            toNode({
              id: COLLECTES_ID,
              label: 'Collectes sélectives',
              enfantIds: [PAPIER_ID],
            }),
            toNode({ id: PAPIER_ID, label: 'Papier' }),
            toNode({ id: ZINC_ID, label: 'Zinc', enfantIds: [ALUMINIUM_ID] }),
            toNode({ id: ALUMINIUM_ID, label: 'Aluminium' }),
          ],
          valeurs: [
            [PAPIER_ID, [toResultat('2022-01-01', 5)]],
            [ALUMINIUM_ID, [toResultat('2022-01-01', 2)]],
          ],
          totals: [[ROOT_ID, []]],
        })
      );

      expect(
        data?.mode === 'stacked' && data.leaves.map(({ label }) => label)
      ).toEqual(['Papier', 'Aluminium']);
    });

    it("n'empile qu'une fois une feuille atteinte par deux parents", () => {
      const NORD_ID = 6;
      const SUD_ID = 7;
      const data = buildSousIndicateursChartData(
        toSource({
          nodes: [
            toNode({
              id: ROOT_ID,
              label: 'Déchets',
              enfantIds: [NORD_ID, SUD_ID],
            }),
            toNode({ id: NORD_ID, label: 'Nord', enfantIds: [VERRE_ID] }),
            toNode({ id: SUD_ID, label: 'Sud', enfantIds: [VERRE_ID] }),
            toNode({ id: VERRE_ID, label: 'Verre' }),
          ],
          valeurs: [[VERRE_ID, [toResultat('2022-01-01', 3)]]],
          totals: [[ROOT_ID, []]],
        })
      );

      expect(
        data?.mode === 'stacked' &&
          data.leaves.map(({ indicateurId, valeurs }) => [
            indicateurId,
            valeurs,
          ])
      ).toEqual([[VERRE_ID, [3]]]);
    });

    it("termine sur un cycle et empile une seule fois la feuille qu'il traverse", () => {
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
          totals: [[ROOT_ID, []]],
        })
      );

      expect(
        data?.mode === 'stacked' &&
          data.leaves.map(({ indicateurId, valeurs }) => [
            indicateurId,
            valeurs,
          ])
      ).toEqual([[VERRE_ID, [3]]]);
    });

    it('termine sur un cycle sans feuille', () => {
      expect(
        buildSousIndicateursChartData(
          toSource({
            nodes: [
              toNode({ id: ROOT_ID, label: 'Racine', enfantIds: [VERRE_ID] }),
              toNode({ id: VERRE_ID, label: 'Verre', enfantIds: [ROOT_ID] }),
            ],
            valeurs: [[VERRE_ID, [toResultat('2022-01-01', 3)]]],
            totals: [[ROOT_ID, []]],
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

    it("trace les objectifs seuls quand aucune feuille n'a de résultat", () => {
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
        mode: 'stacked',
        dates: ['2022-01-01'],
        leaves: [],
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

      expect(data?.mode).toBe('stacked');
    });
  });

  describe('quand le cumul de la racine est décoché', () => {
    const NOT_ADDITIVE_ROOT_TOTALS = [
      toNotAdditiveTotalAtDate({ dateValeur: '2022-01-01' }),
      toNotAdditiveTotalAtDate({ dateValeur: '2023-01-01' }),
    ];

    it("reconnaît le cumul décoché même quand le résultat de l'unique date est masqué pour un visiteur", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: [[VERRE_ID, [toResultat('2022-01-01', 3)]]],
          totals: [
            [
              ROOT_ID,
              [
                toNotAdditiveTotalAtDate({
                  dateValeur: '2022-01-01',
                  resultat: { status: 'hidden' },
                }),
              ],
            ],
          ],
        })
      );

      expect(data).toEqual({
        mode: 'lines',
        dates: ['2022-01-01'],
        lines: [
          {
            indicateurId: VERRE_ID,
            label: 'Verre',
            color: expect.any(String),
            resultatValeurs: [3],
            objectifValeurs: null,
          },
        ],
      });
    });

    it('ne trace pas un enfant intermédiaire dont le total est incomplet à toutes les dates', () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: FULL_VALEURS,
          totals: [
            [ROOT_ID, NOT_ADDITIVE_ROOT_TOTALS],
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
                toTotalAtDate({
                  dateValeur: '2023-01-01',
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

      expect(
        data?.mode === 'lines' && data.lines.map(({ label }) => label)
      ).toEqual(['Verre']);
    });

    it('trace une ligne par enfant direct, sans empiler ni tracer de total', () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: FULL_VALEURS,
          totals: [
            [ROOT_ID, NOT_ADDITIVE_ROOT_TOTALS],
            [
              COLLECTES_ID,
              [
                toTotalAtDate({
                  dateValeur: '2022-01-01',
                  resultat: toComplete(15),
                }),
                toTotalAtDate({
                  dateValeur: '2023-01-01',
                  resultat: toComplete(18),
                }),
              ],
            ],
          ],
        })
      );

      expect(data).toEqual({
        mode: 'lines',
        dates: ['2022-01-01', '2023-01-01'],
        lines: [
          {
            indicateurId: COLLECTES_ID,
            label: 'Collectes sélectives',
            color: expect.any(String),
            resultatValeurs: [15, 18],
            objectifValeurs: null,
          },
          {
            indicateurId: VERRE_ID,
            label: 'Verre',
            color: expect.any(String),
            resultatValeurs: [3, 4],
            objectifValeurs: null,
          },
        ],
      });
    });

    it("trace l'objectif de chaque enfant direct, saisi pour une feuille et total pour un niveau intermédiaire", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: [
            [
              VERRE_ID,
              [
                { dateValeur: '2022-01-01', resultat: 3, objectif: 5 },
                { dateValeur: '2023-01-01', resultat: 4, objectif: null },
              ],
            ],
          ],
          totals: [
            [ROOT_ID, NOT_ADDITIVE_ROOT_TOTALS],
            [
              COLLECTES_ID,
              [
                toTotalAtDate({
                  dateValeur: '2022-01-01',
                  resultat: toComplete(15),
                  objectif: toComplete(20),
                }),
                toTotalAtDate({
                  dateValeur: '2023-01-01',
                  resultat: toComplete(18),
                  objectif: toComplete(22),
                }),
              ],
            ],
          ],
        })
      );

      expect(
        data?.mode === 'lines' &&
          data.lines.map(({ label, resultatValeurs, objectifValeurs }) => ({
            label,
            resultatValeurs,
            objectifValeurs,
          }))
      ).toEqual([
        {
          label: 'Collectes sélectives',
          resultatValeurs: [15, 18],
          objectifValeurs: [20, 22],
        },
        { label: 'Verre', resultatValeurs: [3, 4], objectifValeurs: [5, null] },
      ]);
    });

    it("garde un enfant qui n'a que des objectifs, sans courbe de résultat", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: [
            [
              VERRE_ID,
              [{ dateValeur: '2022-01-01', resultat: null, objectif: 5 }],
            ],
          ],
          totals: [[ROOT_ID, NOT_ADDITIVE_ROOT_TOTALS]],
        })
      );

      expect(
        data?.mode === 'lines' &&
          data.lines.map(({ label, resultatValeurs, objectifValeurs }) => ({
            label,
            resultatValeurs,
            objectifValeurs,
          }))
      ).toEqual([
        { label: 'Verre', resultatValeurs: null, objectifValeurs: [5] },
      ]);
    });

    it("omet l'enfant intermédiaire dont le cumul est lui aussi décoché", () => {
      const data = buildSousIndicateursChartData(
        toSource({
          valeurs: FULL_VALEURS,
          totals: [
            [ROOT_ID, NOT_ADDITIVE_ROOT_TOTALS],
            [
              COLLECTES_ID,
              [toNotAdditiveTotalAtDate({ dateValeur: '2022-01-01' })],
            ],
          ],
        })
      );

      expect(
        data?.mode === 'lines' && data.lines.map(({ label }) => label)
      ).toEqual(['Verre']);
    });

    it("ne renvoie rien quand aucun enfant direct n'a de valeur", () => {
      expect(
        buildSousIndicateursChartData(
          toSource({ totals: [[ROOT_ID, NOT_ADDITIVE_ROOT_TOTALS]] })
        )
      ).toBeNull();
    });
  });

  describe('couleurs', () => {
    const toTableColors = (source: ReturnType<typeof toSource>) =>
      new Map(
        buildSousIndicateursTableData(source).rows.map(
          ({ indicateurId, color }) => [indicateurId, color]
        )
      );

    it('colore chaque feuille empilée comme sa ligne du tableau', () => {
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
        ],
      });
      const data = buildSousIndicateursChartData(source);
      const tableColors = toTableColors(source);

      expect(data?.mode === 'stacked' && data.leaves.length).toBeGreaterThan(1);
      expect(
        data?.mode === 'stacked' &&
          data.leaves.map(({ indicateurId, color }) => [indicateurId, color])
      ).toEqual(
        data?.mode === 'stacked' &&
          data.leaves.map(({ indicateurId }) => [
            indicateurId,
            tableColors.get(indicateurId),
          ])
      );
    });

    it('colore chaque ligne comme sa ligne du tableau quand le cumul est décoché', () => {
      const source = toSource({
        valeurs: FULL_VALEURS,
        totals: [
          [ROOT_ID, [toNotAdditiveTotalAtDate({ dateValeur: '2022-01-01' })]],
          [
            COLLECTES_ID,
            [
              toTotalAtDate({
                dateValeur: '2022-01-01',
                resultat: toComplete(15),
              }),
            ],
          ],
        ],
      });
      const data = buildSousIndicateursChartData(source);
      const tableColors = toTableColors(source);

      expect(data?.mode === 'lines' && data.lines.length).toBe(2);
      expect(
        data?.mode === 'lines' &&
          data.lines.map(({ indicateurId, color }) => [indicateurId, color])
      ).toEqual(
        data?.mode === 'lines' &&
          data.lines.map(({ indicateurId }) => [
            indicateurId,
            tableColors.get(indicateurId),
          ])
      );
    });
  });
});
