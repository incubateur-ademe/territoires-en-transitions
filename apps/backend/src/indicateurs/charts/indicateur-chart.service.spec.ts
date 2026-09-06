import { BadRequestException } from '@nestjs/common';
import type { IndicateurAvecValeursParSource } from '@tet/domain/indicateurs';
import { IndicateurChartBuilder } from './indicateur-chart.builder';
import { IndicateurChartService } from './indicateur-chart.service';

describe('IndicateurChartService', () => {
  it('orchestre les lectures optionnelles et confie uniquement la construction au builder', async () => {
    const definition = {
      id: 7,
      estAgregation: true,
      enfants: [{ id: 8 }, { id: 9 }],
    };
    const indicateurValeurs = {
      definition: { id: 7, periodicite: 'annuelle' },
      sources: {},
    } as unknown as IndicateurAvecValeursParSource;
    const indicateursEnfantValeurs = [
      { sources: {} },
      {
        sources: {
          insee: {
            valeurs: [{ dateValeur: '2026-01-01', objectif: 12 }],
          },
        },
      },
    ] as unknown as IndicateurAvecValeursParSource[];
    const valeursReference = { objectifs: [] };
    const valeursMoyenneCollectivites = [{ dateValeur: '2026-01-01' }];
    const chartData = { series: [] };

    const listIndicateursService = {
      getIndicateur: vi.fn().mockResolvedValue(definition),
      listIndicateurs: vi.fn().mockResolvedValue({
        data: [
          { id: 8, categories: [{ nom: 'vecteur' }] },
          { id: 9, categories: [{ nom: 'vecteur' }] },
        ],
      }),
    };
    const indicateurValeursService = {
      listIndicateurValeurs: vi
        .fn()
        .mockResolvedValueOnce({ indicateurs: [indicateurValeurs] })
        .mockResolvedValueOnce({ indicateurs: indicateursEnfantValeurs }),
    };
    const valeurReferenceService = {
      getValeursReferenceForDefinition: vi
        .fn()
        .mockResolvedValue(valeursReference),
    };
    const valeursMoyenneService = {
      getMoyenneCollectivites: vi
        .fn()
        .mockResolvedValue(valeursMoyenneCollectivites),
    };
    const chartBuilder = {
      build: vi.fn().mockReturnValue(chartData),
      adjustOptionsWithWidth: vi.fn(),
    } as unknown as IndicateurChartBuilder;
    const service = new IndicateurChartService(
      listIndicateursService as never,
      indicateurValeursService as never,
      valeurReferenceService as never,
      valeursMoyenneService as never,
      chartBuilder
    );

    const result = await service.getIndicateurValeursAndChartData({
      collectiviteId: 42,
      indicateurId: 7,
      sources: [{ sourceId: 'collectivite' }],
      includeReferenceValeurs: true,
      includeMoyenne: true,
      includeSegmentation: { type: 'vecteur' },
      chartSize: { width: 250, height: 100 },
    });

    expect(listIndicateursService.getIndicateur).toHaveBeenCalledWith({
      indicateurId: 7,
      collectiviteId: 42,
    });
    expect(indicateurValeursService.listIndicateurValeurs).toHaveBeenCalledWith(
      {
        collectiviteId: 42,
        indicateurIds: [7],
        sources: ['collectivite'],
      },
      { isUserTrusted: true }
    );
    expect(indicateurValeursService.listIndicateurValeurs).toHaveBeenCalledWith(
      { collectiviteId: 42, indicateurIds: [8, 9] },
      { isUserTrusted: true }
    );
    expect(chartBuilder.build).toHaveBeenCalledWith({
      indicateurValeurs,
      valeursReference,
      valeursMoyenneCollectivites,
      sourcesFilter: [{ sourceId: 'collectivite' }],
      segmentation: {
        type: 'vecteur',
        indicateursEnfantValeurs,
        source: 'insee',
        valeurType: 'objectif',
      },
    });
    expect(chartBuilder.adjustOptionsWithWidth).toHaveBeenCalledWith(
      chartData,
      250
    );
    expect(result).toEqual({
      indicateurValeurs,
      indicateurSegmentation: {
        type: 'vecteur',
        indicateursEnfantValeurs,
        source: 'insee',
        valeurType: 'objectif',
      },
      valeursReference,
      chartData,
    });
  });

  it('refuse une requête sans identifiant avant toute lecture', async () => {
    const listIndicateursService = {
      getIndicateur: vi.fn(),
      getIndicateurByIdentifiantReferentiel: vi.fn(),
    };
    const service = new IndicateurChartService(
      listIndicateursService as never,
      {} as never,
      {} as never,
      {} as never,
      {} as IndicateurChartBuilder
    );

    await expect(
      service.getIndicateurValeursAndChartData({ collectiviteId: 42 })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(listIndicateursService.getIndicateur).not.toHaveBeenCalled();
    expect(
      listIndicateursService.getIndicateurByIdentifiantReferentiel
    ).not.toHaveBeenCalled();
  });
});
