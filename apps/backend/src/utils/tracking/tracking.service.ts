import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { FeatureFlagKey } from '@tet/domain/utils';
import type {
  EventTracker,
  FeatureFlagEvaluationOptions,
  FeatureFlags,
  TrackedEvent,
} from './event-tracker.interface';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @Inject('EventTracker') private readonly eventTracker: EventTracker
  ) {}

  capture(params: TrackedEvent) {
    if (!this.eventTracker.isEnabled()) {
      return;
    }

    try {
      this.eventTracker.capture(params);
      this.logger.log(`Événement capturé: ${params.event}`, {
        distinctId: params.distinctId,
      });
    } catch (error) {
      this.logger.error("Erreur lors du tracking de l'événement", error);
    }
  }

  isEnabled(): boolean {
    return this.eventTracker.isEnabled();
  }

  isFeatureEnabled(
    featureFlagKey: FeatureFlagKey,
    userId?: string,
    collectiviteId?: number,
    options?: FeatureFlagEvaluationOptions
  ): Promise<boolean> {
    return userId
      ? this.eventTracker.isFeatureEnabled(
          featureFlagKey,
          userId,
          collectiviteId,
          options
        )
      : Promise.resolve(false);
  }

  listFeatureFlags(
    { collectiviteId }: { collectiviteId?: number },
    { user }: { user: AuthenticatedUser }
  ): Promise<FeatureFlags> {
    return this.eventTracker.listFeatureFlags({
      userId: user.id,
      email: user.jwtPayload.email,
      collectiviteId,
    });
  }

  async shutdown(): Promise<void> {
    await this.eventTracker.shutdown();
    this.logger.log('Service de tracking arrêté');
  }
}
