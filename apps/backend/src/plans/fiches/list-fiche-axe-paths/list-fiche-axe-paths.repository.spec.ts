import { FicheAxePathErrorEnum } from '@tet/backend/collectivites/analysis/analyze-fiches/analyze-fiches.errors';
import { GetAxeRepository } from '@tet/backend/plans/axes/get-axe/get-axe.repository';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { describe, expect, it } from 'vitest';
import { ListFicheAxePathsRepository } from './list-fiche-axe-paths.repository';

const buildDatabaseService = (select: () => Promise<unknown>) =>
  ({
    db: { select: () => ({ from: () => ({ where: select }) }) },
  } as unknown as DatabaseService);

const buildRepository = ({
  select,
  getAxesChemins,
}: {
  select: () => Promise<unknown>;
  getAxesChemins: GetAxeRepository['getAxesChemins'];
}) =>
  new ListFicheAxePathsRepository(buildDatabaseService(select), {
    getAxesChemins,
  } as unknown as GetAxeRepository);

describe('ListFicheAxePathsRepository', () => {
  it('échoue quand le chemin des axes ne peut pas être lu', async () => {
    const repository = buildRepository({
      select: async () => [{ ficheId: 1, axeId: 10 }],
      getAxesChemins: async () => ({ success: false, error: 'SERVER_ERROR' }),
    });

    expect(await repository.listFicheAxePaths({ ficheIds: [1] })).toEqual({
      success: false,
      error: FicheAxePathErrorEnum.LIST_FICHE_AXE_PATHS_ERROR,
    });
  });

  it('échoue quand la lecture des liens fiche-axe échoue', async () => {
    const repository = buildRepository({
      select: async () => {
        throw new Error('connexion perdue');
      },
      getAxesChemins: async () => ({ success: true, data: {} }),
    });

    expect(await repository.listFicheAxePaths({ ficheIds: [1] })).toEqual({
      success: false,
      error: FicheAxePathErrorEnum.LIST_FICHE_AXE_PATHS_ERROR,
    });
  });
});
