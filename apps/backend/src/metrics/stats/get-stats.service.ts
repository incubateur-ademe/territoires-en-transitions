import { Injectable, Logger } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { GetStatsInput } from './get-stats.input';
import { GetStatsOutput } from './get-stats.output';
import { GetStatsRepository } from './get-stats.repository';
import {
  buildStatsSeries,
  getSeriesStart,
  getStatsDescription,
} from './get-stats.rules';

@Injectable()
export class GetStatsService {
  private readonly logger = new Logger(GetStatsService.name);

  constructor(private readonly getStatsRepository: GetStatsRepository) {}

  /** KPI publique : nombre de fiches action créées par période. */
  async getStatsCreationFiches(
    { since, periodicity }: GetStatsInput,
    now: Date
  ): Promise<Result<GetStatsOutput, typeof CommonErrorEnum.DATABASE_ERROR>> {
    try {
      const counts = await this.getStatsRepository.countFichesCreeesParPeriode({
        periodicity,
        from: getSeriesStart({ now, periodicity, since }),
      });

      return success({
        description: getStatsDescription(periodicity),
        stats: buildStatsSeries({ counts, now, periodicity, since }),
      });
    } catch (error) {
      this.logger.error(error);
      return failure(CommonErrorEnum.DATABASE_ERROR);
    }
  }
}
