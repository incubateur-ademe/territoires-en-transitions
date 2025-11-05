import { Inject, Injectable, Logger } from '@nestjs/common';
import type { EventTracker } from './event-tracker.interface';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @Inject('EventTracker') private readonly eventTracker: EventTracker
  ) {}

  capture(params: {
    distinctId: string;
    event: string;
    properties?: Record<string, string | number | boolean | undefined>;
  }) {
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

  async shutdown(): Promise<void> {
    await this.eventTracker.shutdown();
    this.logger.log('Service de tracking arrêté');
  }
}
