import { Injectable, Logger } from '@nestjs/common';
import {
  FicheAxePathError,
  FicheAxePathErrorEnum,
} from '@tet/backend/collectivites/analysis/analyze-fiches/analyze-fiches.errors';
import {
  FicheAxePathRepository,
  FicheAxePaths,
} from '@tet/backend/collectivites/analysis/analyze-fiches/fiche-axe-path.repository';
import { GetAxeRepository } from '@tet/backend/plans/axes/get-axe/get-axe.repository';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { inArray } from 'drizzle-orm';
import { uniq } from 'es-toolkit';
import { ficheActionAxeTable } from '../shared/models/fiche-action-axe.table';
import { toFicheAxePaths } from './list-fiche-axe-paths.rules';

@Injectable()
export class ListFicheAxePathsRepository extends FicheAxePathRepository {
  private readonly logger = new Logger(ListFicheAxePathsRepository.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly getAxeRepository: GetAxeRepository
  ) {
    super();
  }

  async listFicheAxePaths({
    ficheIds,
  }: {
    readonly ficheIds: readonly number[];
  }): Promise<Result<FicheAxePaths[], FicheAxePathError>> {
    if (ficheIds.length === 0) {
      return success([]);
    }
    try {
      const links = await this.databaseService.db
        .select({
          ficheId: ficheActionAxeTable.ficheId,
          axeId: ficheActionAxeTable.axeId,
        })
        .from(ficheActionAxeTable)
        .where(inArray(ficheActionAxeTable.ficheId, [...ficheIds]));

      const ancestries = await this.getAxeRepository.getAxesChemins(
        uniq(links.map(({ axeId }) => axeId))
      );
      if (!ancestries.success) {
        return failure(FicheAxePathErrorEnum.LIST_FICHE_AXE_PATHS_ERROR);
      }

      return success(
        toFicheAxePaths({
          ficheIds,
          links,
          ancestryByAxeId: ancestries.data,
        })
      );
    } catch (error) {
      this.logger.error(
        `Could not list axe paths of ${
          ficheIds.length
        } fiches: ${getErrorMessage(error)}`
      );
      return failure(FicheAxePathErrorEnum.LIST_FICHE_AXE_PATHS_ERROR);
    }
  }
}
