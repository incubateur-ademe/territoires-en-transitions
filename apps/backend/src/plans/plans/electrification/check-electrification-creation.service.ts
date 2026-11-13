import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { ELECTRIFICATION_PLAN_TYPE_KEY, PlanType } from '@tet/domain/plans';
import { FeatureFlagEnum } from '@tet/domain/utils';

/** Le déploiement concerne la création ; l'éligibilité reste propre à l'import. */
@Injectable()
export class CheckElectrificationCreationService {
  constructor(private readonly tracking: TrackingService) {}

  appliesTo({ categorie, type }: PlanType): boolean {
    return (
      categorie === ELECTRIFICATION_PLAN_TYPE_KEY.categorie &&
      type === ELECTRIFICATION_PLAN_TYPE_KEY.type
    );
  }

  async isEnabled(
    { collectiviteId }: { collectiviteId: number },
    { user }: ServiceSecondArg
  ): Promise<boolean> {
    return this.tracking
      .isFeatureEnabled(
        FeatureFlagEnum['IS-ELECTRIFICATION-PLAN-CREATION-ENABLED'],
        user.id,
        collectiviteId,
        { requireExplicitActivation: true }
      )
      .catch(() => false);
  }
}
