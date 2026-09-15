import { renderHook } from '@testing-library/react';
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
});
