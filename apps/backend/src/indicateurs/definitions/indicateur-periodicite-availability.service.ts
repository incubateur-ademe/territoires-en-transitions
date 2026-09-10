import { Injectable } from '@nestjs/common';
import type { AuthenticatedOrServiceRoleUser } from '@tet/backend/users/models/auth.models';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import {
  getIndicateurPeriodiciteRollout,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';

export type PeriodiciteAvailabilityContext = Omit<ServiceSecondArg, 'user'> & {
  user: AuthenticatedOrServiceRoleUser | null;
};

type AvailabilityInput = {
  periodicite: IndicateurPeriodicite;
  collectiviteId?: number;
};

export type PeriodiciteAvailabilityError =
  | 'PERIODICITE_UNAVAILABLE'
  | 'SERVER_ERROR';

@Injectable()
export class IndicateurPeriodiciteAvailabilityService {
  constructor(private readonly trackingService: TrackingService) {}

  async checkAvailable(
    { periodicite, collectiviteId }: AvailabilityInput,
    { user }: PeriodiciteAvailabilityContext
  ): Promise<Result<void, PeriodiciteAvailabilityError>> {
    const { activationFeatureFlag } =
      getIndicateurPeriodiciteRollout(periodicite);
    if (activationFeatureFlag === null) return success(undefined);

    try {
      const enabled = await this.trackingService.isFeatureEnabled(
        activationFeatureFlag,
        user?.id ?? 'indicateur-catalog-import',
        collectiviteId
      );
      return enabled
        ? success(undefined)
        : failure(
            'PERIODICITE_UNAVAILABLE',
            new Error(
              `La périodicité ${periodicite} n'est pas encore disponible`
            )
          );
    } catch (error) {
      return failure(
        'SERVER_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /** The rollout gates assignments; existing cadences remain editable. */
  checkAssignmentAvailable(
    input: AvailabilityInput & { current?: IndicateurPeriodicite },
    context: PeriodiciteAvailabilityContext
  ): Promise<Result<void, PeriodiciteAvailabilityError>> {
    return input.periodicite === input.current
      ? Promise.resolve(success(undefined))
      : this.checkAvailable(input, context);
  }
}
