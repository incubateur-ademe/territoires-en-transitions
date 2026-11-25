import { failure, Result, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ListIndicateursService } from '../indicateurs/list-indicateurs/list-indicateurs.service';
import ValeursMoyenneService from '../valeurs/get-moyenne-indicateur-valeurs/valeurs-moyenne.service';
import ValeursReferenceService from '../valeurs/get-valeurs-reference/valeurs-reference.service';
import ManageIndicateurValeursService from '../valeurs/manage-indicateur-valeurs/manage-indicateur-valeurs.service';
import { IndicateurChartBuilder } from './indicateur-chart.builder';
import { IndicateurChartService } from './indicateur-chart.service';

const collectiviteId = 3;
const indicateurId = 10;
const indicateur = { id: indicateurId, periodicite: 'annuelle' };
const indicateurAgregation = {
  ...indicateur,
  estAgregation: true,
  enfants: [{ id: 11 }],
};
const indicateurValeurs = { definition: indicateur, sources: {} };
const chartData = { dataset: [] };

const toServiceWithMocks = ({
  getIndicateur = vi.fn().mockResolvedValue(success(indicateur)),
  getIndicateurByIdentifiantReferentiel = vi
    .fn()
    .mockResolvedValue(success(indicateur)),
  listIndicateurs = vi.fn().mockResolvedValue(success({ data: [{ id: 11 }] })),
  listIndicateurValeurs = vi
    .fn()
    .mockResolvedValue(success({ indicateurs: [indicateurValeurs] })),
  getValeursReferenceForDefinition = vi.fn().mockResolvedValue(success(null)),
  getMoyenneCollectivites = vi.fn().mockResolvedValue(success(null)),
  build = vi.fn().mockReturnValue(chartData),
}: {
  getIndicateur?: ReturnType<typeof vi.fn>;
  getIndicateurByIdentifiantReferentiel?: ReturnType<typeof vi.fn>;
  listIndicateurs?: ReturnType<typeof vi.fn>;
  listIndicateurValeurs?: ReturnType<typeof vi.fn>;
  getValeursReferenceForDefinition?: ReturnType<typeof vi.fn>;
  getMoyenneCollectivites?: ReturnType<typeof vi.fn>;
  build?: ReturnType<typeof vi.fn>;
} = {}) => {
  const listIndicateursService = {
    getIndicateur,
    getIndicateurByIdentifiantReferentiel,
    listIndicateurs,
  } as unknown as ListIndicateursService;
  const indicateurValeursService = {
    listIndicateurValeurs,
  } as unknown as ManageIndicateurValeursService;
  const valeurReferenceService = {
    getValeursReferenceForDefinition,
  } as unknown as ValeursReferenceService;
  const valeursMoyenneService = {
    getMoyenneCollectivites,
  } as unknown as ValeursMoyenneService;
  const chartBuilder = { build } as unknown as IndicateurChartBuilder;
  return new IndicateurChartService(
    listIndicateursService,
    indicateurValeursService,
    valeurReferenceService,
    valeursMoyenneService,
    chartBuilder
  );
};

describe('IndicateurChartService.getIndicateurValeursAndChartData', () => {
  it('retourne un échec INVALID_INPUT sans identifiant d’indicateur', async () => {
    const result = await toServiceWithMocks().getIndicateurValeursAndChartData({
      collectiviteId,
    });

    expect(result).toEqual(
      failure(
        'INVALID_INPUT',
        new Error(
          'Either indicateurId or identifiantReferentiel must be provided'
        )
      )
    );
  });

  it('retourne les données du graphique en cas de succès', async () => {
    const result = await toServiceWithMocks().getIndicateurValeursAndChartData({
      collectiviteId,
      indicateurId,
    });

    expect(result).toEqual(
      success({
        indicateurValeurs,
        indicateurSegmentation: null,
        valeursReference: null,
        chartData,
      })
    );
  });

  it('propage l’échec de lecture de l’indicateur avec sa cause', async () => {
    const cause = new Error('Droits insuffisants');

    const result = await toServiceWithMocks({
      getIndicateur: vi.fn().mockResolvedValue(failure('UNAUTHORIZED', cause)),
    }).getIndicateurValeursAndChartData({ collectiviteId, indicateurId });

    expect(result).toEqual(failure('UNAUTHORIZED', cause));
  });

  it('convertit un échec de lecture des valeurs en INDICATEUR_VALEURS_FAILED avec sa cause', async () => {
    const cause = new Error('Droits insuffisants');

    const result = await toServiceWithMocks({
      listIndicateurValeurs: vi
        .fn()
        .mockResolvedValue(failure('UNAUTHORIZED', cause)),
    }).getIndicateurValeursAndChartData({ collectiviteId, indicateurId });

    expect(result).toEqual(failure('INDICATEUR_VALEURS_FAILED', cause));
  });

  it('propage l’échec des valeurs de référence avec sa cause', async () => {
    const cause = new Error('Collectivité introuvable');

    const result = await toServiceWithMocks({
      getValeursReferenceForDefinition: vi
        .fn()
        .mockResolvedValue(failure('NOT_FOUND', cause)),
    }).getIndicateurValeursAndChartData({
      collectiviteId,
      indicateurId,
      includeReferenceValeurs: true,
    });

    expect(result).toEqual(failure('NOT_FOUND', cause));
  });

  it('propage l’échec de la moyenne des collectivités avec sa cause', async () => {
    const cause = new Error('Droits insuffisants');

    const result = await toServiceWithMocks({
      getMoyenneCollectivites: vi
        .fn()
        .mockResolvedValue(failure('UNAUTHORIZED', cause)),
    }).getIndicateurValeursAndChartData({
      collectiviteId,
      indicateurId,
      includeMoyenne: true,
    });

    expect(result).toEqual(failure('UNAUTHORIZED', cause));
  });

  it('convertit une exception imprévue en DATABASE_ERROR avec sa cause', async () => {
    const cause = new Error('construction impossible');

    const result: Result<unknown, string> = await toServiceWithMocks({
      build: vi.fn().mockImplementation(() => {
        throw cause;
      }),
    }).getIndicateurValeursAndChartData({ collectiviteId, indicateurId });

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it('lit l’indicateur par son identifiant référentiel sans passer par son id', async () => {
    const getIndicateur = vi.fn();
    const getIndicateurByIdentifiantReferentiel = vi
      .fn()
      .mockResolvedValue(success(indicateur));

    const result = await toServiceWithMocks({
      getIndicateur,
      getIndicateurByIdentifiantReferentiel,
    }).getIndicateurValeursAndChartData({
      collectiviteId,
      identifiantReferentiel: 'cae_1.a',
    });

    expect(result.success).toBe(true);
    expect(getIndicateurByIdentifiantReferentiel).toHaveBeenCalledWith({
      identifiantReferentiel: 'cae_1.a',
      collectiviteId,
    });
    expect(getIndicateur).not.toHaveBeenCalled();
  });

  it('lit l’indicateur par son id sans passer par son identifiant référentiel', async () => {
    const getIndicateur = vi.fn().mockResolvedValue(success(indicateur));
    const getIndicateurByIdentifiantReferentiel = vi.fn();

    await toServiceWithMocks({
      getIndicateur,
      getIndicateurByIdentifiantReferentiel,
    }).getIndicateurValeursAndChartData({ collectiviteId, indicateurId });

    expect(getIndicateur).toHaveBeenCalledWith({
      indicateurId,
      collectiviteId,
    });
    expect(getIndicateurByIdentifiantReferentiel).not.toHaveBeenCalled();
  });

  it.each(['INDICATEUR_NOT_FOUND', 'DATABASE_ERROR'] as const)(
    'propage %s de la lecture de l’indicateur avec sa cause',
    async (error) => {
      const cause = new Error('cause d’origine');

      const result = await toServiceWithMocks({
        getIndicateur: vi.fn().mockResolvedValue(failure(error, cause)),
      }).getIndicateurValeursAndChartData({ collectiviteId, indicateurId });

      expect(result).toEqual(failure(error, cause));
    }
  );

  it('propage l’échec de la liste des indicateurs enfants avec sa cause', async () => {
    const cause = new Error('Droits insuffisants');

    const result = await toServiceWithMocks({
      getIndicateur: vi.fn().mockResolvedValue(success(indicateurAgregation)),
      listIndicateurs: vi
        .fn()
        .mockResolvedValue(failure('UNAUTHORIZED', cause)),
    }).getIndicateurValeursAndChartData({
      collectiviteId,
      indicateurId,
      includeSegmentation: {},
    });

    expect(result).toEqual(failure('UNAUTHORIZED', cause));
  });

  it('convertit un échec de lecture des valeurs des enfants en INDICATEUR_VALEURS_FAILED avec sa cause', async () => {
    const cause = new Error('lecture impossible');
    const listIndicateurValeurs = vi
      .fn()
      .mockResolvedValueOnce(success({ indicateurs: [indicateurValeurs] }))
      .mockResolvedValueOnce(failure('DATABASE_ERROR', cause));

    const result = await toServiceWithMocks({
      getIndicateur: vi.fn().mockResolvedValue(success(indicateurAgregation)),
      listIndicateurValeurs,
    }).getIndicateurValeursAndChartData({
      collectiviteId,
      indicateurId,
      includeSegmentation: {},
    });

    expect(result).toEqual(failure('INDICATEUR_VALEURS_FAILED', cause));
  });

  it('retourne d’abord l’échec des valeurs quand tout échoue, puis la référence, la moyenne et la segmentation', async () => {
    const valeursCause = new Error('valeurs');
    const referenceCause = new Error('référence');
    const moyenneCause = new Error('moyenne');
    const segmentationCause = new Error('segmentation');
    const failures = {
      listIndicateurValeurs: vi
        .fn()
        .mockResolvedValue(failure('DATABASE_ERROR', valeursCause)),
      getValeursReferenceForDefinition: vi
        .fn()
        .mockResolvedValue(failure('NOT_FOUND', referenceCause)),
      getMoyenneCollectivites: vi
        .fn()
        .mockResolvedValue(failure('UNAUTHORIZED', moyenneCause)),
      listIndicateurs: vi
        .fn()
        .mockResolvedValue(failure('UNAUTHORIZED', segmentationCause)),
    };
    const input = {
      collectiviteId,
      indicateurId,
      includeReferenceValeurs: true,
      includeMoyenne: true,
      includeSegmentation: {},
    };
    const getIndicateur = vi
      .fn()
      .mockResolvedValue(success(indicateurAgregation));

    const withEverythingFailing = (overrides: Partial<typeof failures>) =>
      toServiceWithMocks({
        getIndicateur,
        ...failures,
        ...overrides,
      }).getIndicateurValeursAndChartData(input);

    const succeeded = success(null);
    expect(await withEverythingFailing({})).toEqual(
      failure('INDICATEUR_VALEURS_FAILED', valeursCause)
    );
    expect(
      await withEverythingFailing({
        listIndicateurValeurs: vi
          .fn()
          .mockResolvedValue(success({ indicateurs: [indicateurValeurs] })),
      })
    ).toEqual(failure('NOT_FOUND', referenceCause));
    expect(
      await withEverythingFailing({
        listIndicateurValeurs: vi
          .fn()
          .mockResolvedValue(success({ indicateurs: [indicateurValeurs] })),
        getValeursReferenceForDefinition: vi.fn().mockResolvedValue(succeeded),
      })
    ).toEqual(failure('UNAUTHORIZED', moyenneCause));
    expect(
      await withEverythingFailing({
        listIndicateurValeurs: vi
          .fn()
          .mockResolvedValue(success({ indicateurs: [indicateurValeurs] })),
        getValeursReferenceForDefinition: vi.fn().mockResolvedValue(succeeded),
        getMoyenneCollectivites: vi.fn().mockResolvedValue(succeeded),
      })
    ).toEqual(failure('UNAUTHORIZED', segmentationCause));
  });
});
