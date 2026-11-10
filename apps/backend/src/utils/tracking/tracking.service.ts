import { Inject, Injectable, Logger } from '@nestjs/common';
import { FeatureFlagKey } from '@tet/domain/utils';
import type {
  EventTracker,
  FeatureFlagEvaluationOptions,
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

  async shutdown(): Promise<void> {
    await this.eventTracker.shutdown();
    this.logger.log('Service de tracking arrêté');
  }
}
