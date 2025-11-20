import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { PostHog } from 'posthog-node';
import { EventTracker } from './event-tracker.interface';

@Injectable()
export class PostHogEventTracker
  implements EventTracker, OnApplicationShutdown
{
  private readonly logger = new Logger(PostHogEventTracker.name);
  private readonly posthog: PostHog | null = null;

  constructor(private readonly configurationService: ConfigurationService) {
    const postHogKey = this.configurationService.get('POSTHOG_KEY');
    const postHogHost = this.configurationService.get('POSTHOG_HOST');
    if (postHogKey && postHogHost) {
      this.posthog = new PostHog(postHogKey, {
        host: postHogHost,
        flushAt: 20,
        flushInterval: 10000,
      });
      this.logger.log('Tracking PostHog initialisé');
    } else {
      this.logger.warn('POSTHOG_KEY non trouvée');
    }
  }

  capture(params: {
    distinctId: string;
    event: string;
    properties?: Record<string, string | number | boolean | undefined>;
  }) {
    if (!this.posthog) {
      return;
    }

    this.posthog.capture(params);
  }

  isEnabled(): boolean {
    return this.posthog !== null;
  }

  async shutdown(): Promise<void> {
    if (this.posthog) {
      await this.posthog.shutdown();
      this.logger.log('Arrêt du tracking PostHog');
    }
  }

  async onApplicationShutdown() {
    await this.shutdown();
  }
}
