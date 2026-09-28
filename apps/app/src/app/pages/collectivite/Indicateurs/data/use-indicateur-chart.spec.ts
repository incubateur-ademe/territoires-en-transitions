import { act, renderHook } from '@testing-library/react';
import { IndicateurPeriods } from '@tet/domain/indicateurs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IndicateurDefinitionListItem } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { useIndicateurChartInfo } from './use-indicateur-chart';

const mocks = vi.hoisted(() => ({
  listValeurs: vi.fn(),
  listDefinitions: vi.fn(),
  sourceFilter: vi.fn(),
}));

vi.mock('@tet/api/collectivites', () => ({ useCollectiviteId: () => 42 }));

vi.mock('@/app/indicateurs/valeurs/use-list-indicateur-valeurs', () => ({
  useListIndicateurValeurs: mocks.listValeurs,
}));

vi.mock('@/app/indicateurs/indicateurs/use-list-indicateurs', () => ({
  useListIndicateurs: mocks.listDefinitions,
}));

vi.mock('./use-source-filter', () => ({
  useSourceFilter: mocks.sourceFilter,
}));

describe('useIndicateurChartInfo', () => {
  beforeEach(() => {
    mocks.listValeurs.mockReset();
    mocks.listDefinitions.mockReset();
    mocks.sourceFilter.mockReset();
  });

  it('intègre une moyenne mensuelle aux sources et aux périodes du graphique', () => {
    mocks.listValeurs.mockImplementation(
      ({ indicateurIds }: { indicateurIds?: number[] }) =>
        indicateurIds?.length
          ? {
              data: {
                indicateurs: [
                  {
                    definition: { id: 7, periodicite: 'mensuelle' },
                    sources: {},
                    totalFilledValeursCount: 0,
                  },
                ],
              },
              isLoading: false,
            }
          : { data: undefined, isLoading: false }
    );
    mocks.listDefinitions.mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });
    const sourceFilter = {
      sources: undefined,
      avecDonneesCollectivite: false,
      avecSecteursSNBC: false,
      moyenne: {
        typeCollectivite: 'commune',
        valeurs: [
          {
            sourceLibelle: 'CITEPA',
            dateValeur: '2026-02-01',
            valeur: 12,
          },
        ],
      },
      valeursReference: undefined,
    };
    mocks.sourceFilter.mockReturnValue(sourceFilter);
    const definition = {
      id: 7,
      estAgregation: false,
      enfants: [],
      unite: 't',
      periodicite: 'mensuelle',
    } as unknown as IndicateurDefinitionListItem;

    const { result } = renderHook(() => useIndicateurChartInfo({ definition }));

    expect(result.current.data.periodicite).toBe('mensuelle');
    expect(result.current.data.valeurs.resultats.sources).toEqual([
      expect.objectContaining({
        source: 'moyenne',
        valeurs: [
          expect.objectContaining({
            periode: IndicateurPeriods.parse('mensuelle', '2026-02'),
            valeur: 12,
          }),
        ],
      }),
    ]);
    expect(result.current.data.valeurs.resultats.periodes).toEqual([
      IndicateurPeriods.parse('mensuelle', '2026-02'),
    ]);
    expect(result.current.hasValeur).toBe(true);
  });
  it('conserve un point annuel agrégé par enfant et sépare les historiques annuels', () => {
    const child = {
      id: 8,
      periodicite: 'mensuelle',
      aggregationResultat: 'somme',
      aggregationObjectif: null,
      categories: [],
      titre: 'Sous-indicateur',
    };
    const values = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      periodicite: 'mensuelle',
      dateValeur: `2026-${String(index + 1).padStart(2, '0')}-01`,
      resultat: 10,
    }));
    mocks.listValeurs.mockImplementation(
      ({ indicateurIds }: { indicateurIds: number[] }) => ({
        data: {
          indicateurs:
            indicateurIds[0] === 8
              ? [
                  {
                    definition: child,
                    sources: {
                      collectivite: {
                        source: 'collectivite',
                        ordreAffichage: -1,
                        libelle: '',
                        metadonnees: [],
                        valeurs: [
                          ...values,
                          {
                            id: 20,
                            periodicite: 'annuelle',
                            dateValeur: '2026-01-01',
                            resultat: 900,
                          },
                        ],
                      },
                    },
                    totalFilledValeursCount: 13,
                  },
                ]
              : [
                  {
                    definition: { id: 7, periodicite: 'mensuelle' },
                    sources: {},
                    totalFilledValeursCount: 0,
                  },
                ],
        },
        isLoading: false,
      })
    );
    mocks.listDefinitions.mockReturnValue({
      data: { data: [child] },
      isLoading: false,
    });
    mocks.sourceFilter.mockReturnValue({
      sources: undefined,
      avecDonneesCollectivite: true,
      avecSecteursSNBC: false,
      moyenne: undefined,
      valeursReference: undefined,
    });
    const definition = {
      id: 7,
      estAgregation: true,
      enfants: [{ id: 8 }],
      periodicite: 'mensuelle',
      unite: 't',
      aggregationResultat: 'somme',
      aggregationObjectif: null,
    } as unknown as IndicateurDefinitionListItem;
    const { result } = renderHook(() => useIndicateurChartInfo({ definition }));
    act(() => result.current.setPeriodiciteAffichage('annuelle'));
    expect(result.current.data.valeurs.segments).toHaveLength(2);
    expect(
      result.current.data.valeurs.segments.map(
        ({ source }) => source.valeurs[0].valeur
      )
    ).toEqual(expect.arrayContaining([120, 900]));
  });
});
