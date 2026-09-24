import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import { GetIndicateursAssociesService } from './get-indicateurs-associes.service';
import type { IndicateurDefinitionAvecCategories } from './score-indicatif.repository';

const createService = (
  periodicite: IndicateurDefinitionAvecCategories['periodicite']
) =>
  new GetIndicateursAssociesService(
    {
      getIndicateurDefinitionsByIdentifiants: vi.fn().mockResolvedValue({
        success: true,
        data: [
          {
            indicateurId: 42,
            identifiantReferentiel: 'ind_test',
            unite: '%',
            titre: 'Indicateur de test',
            categories: [],
            periodicite,
          },
        ],
      }),
    } as never,
    {
      extractNeededSourceIndicateursFromFormula: vi
        .fn()
        .mockReturnValue([
          { identifiant: 'ind_test', optional: false, tokens: [] },
        ]),
    } as never,
    {
      getCollectiviteAvecType: vi.fn().mockResolvedValue({ drom: false }),
    } as never
  );

const input = {
  collectiviteId: 1,
  formules: [{ actionId: 'cae_1.1.1', exprScore: 'ind_test' }],
};

describe('GetIndicateursAssociesService periodicity', () => {
  it('preserves the annual cadence through definition association', async () => {
    const service = createService(IndicateurPeriodiciteEnum.ANNUELLE);
    await expect(service.getIndicateursAssocies(input)).resolves.toMatchObject({
      success: true,
      data: {
        indicateursAssocies: [
          { indicateurId: 42, periodicite: IndicateurPeriodiciteEnum.ANNUELLE },
        ],
      },
    });
  });

  it('preserves monthly definitions so their external annual series can be queried', async () => {
    const service = createService(IndicateurPeriodiciteEnum.MENSUELLE);
    await expect(service.getIndicateursAssocies(input)).resolves.toMatchObject({
      success: true,
      data: {
        indicateursAssocies: [{ indicateurId: 42, periodicite: 'mensuelle' }],
      },
    });
  });
});
