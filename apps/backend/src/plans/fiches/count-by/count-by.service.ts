import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { isCountByPropertyMasked } from '@tet/backend/plans/fiches/list-fiches/fiches-restreintes.rules';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { getDataOrThrow, Result } from '@tet/backend/utils/result.type';
import {
  CountByPropertyEnumType,
  FicheWithRelations,
  ListFichesRequestFilters,
} from '@tet/domain/plans';
import { DateTime } from 'luxon';
import {
  CountByCalculation,
  CountByRuleError,
  CountByRules,
} from './count-by.rules';

@Injectable()
export class CountByService {
  private readonly logger = new Logger(CountByService.name);

  readonly NO_AXE_ID = CountByRules.NO_AXE_ID;
  readonly NO_AXE_NOM = CountByRules.NO_AXE_NOM;

  constructor(private readonly ficheActionListService: ListFichesService) {}

  async countByProperty(
    collectiviteId: number,
    countByProperty: CountByPropertyEnumType,
    filters: ListFichesRequestFilters,
    { user }: { user: AuthUser }
  ) {
    this.logger.log(
      `Calcul du count by ${countByProperty} des fiches action pour la collectivité ${collectiviteId}: filtre ${JSON.stringify(
        filters
      )}`
    );
    try {
      const { data: fiches } = getDataOrThrow(
        await this.ficheActionListService.getFichesActionResumes(
          {
            collectiviteId,
            filters,
            readsMaskedFields: isCountByPropertyMasked(countByProperty),
          },
          { user }
        )
      );
      return this.countByPropertyWithFiches(fiches, countByProperty, filters);
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async countByPropertyWithFiches(
    fiches: FicheWithRelations[],
    countByProperty: CountByPropertyEnumType,
    filters: ListFichesRequestFilters
  ) {
    const rules = new CountByRules(DateTime.now());
    return this.getCountsOrThrow(
      rules.countByPropertyWithFiches(fiches, countByProperty, filters),
      countByProperty
    );
  }

  async countByPropertyForEachAxeWithFiches(
    planId: number,
    fiches: FicheWithRelations[],
    countByProperty: CountByPropertyEnumType,
    filters: ListFichesRequestFilters
  ) {
    const rules = new CountByRules(DateTime.now());
    return this.getCountsOrThrow(
      rules.countByPropertyForEachAxeWithFiches(
        planId,
        fiches,
        countByProperty,
        filters
      ),
      countByProperty
    );
  }

  private getCountsOrThrow<T>(
    result: Result<CountByCalculation<T>, CountByRuleError>,
    countByProperty: CountByPropertyEnumType
  ): T {
    if (!result.success) {
      throw new NotImplementedException(
        `Count by ${countByProperty} not implemented`
      );
    }
    for (const invalid of result.data.invalidDates) {
      this.logger.error(
        `Fiche action (id ${invalid.ficheId}, collectiviteId: ${invalid.collectiviteId}) with invalid date slot: ${invalid.value} for ${invalid.countByProperty}`
      );
    }
    return result.data.counts;
  }
}
