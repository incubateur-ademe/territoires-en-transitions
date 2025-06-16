import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { PostHog } from 'posthog-node';

@Injectable()
export class PostHogService implements OnApplicationShutdown {
  private readonly logger = new Logger(PostHogService.name);
  private readonly posthog: PostHog | null = null;

  constructor() {
    const postHogKey = process.env.POSTHOG_KEY;
    if (postHogKey) {
      this.posthog = new PostHog(postHogKey, {
        host: process.env.POSTHOG_HOST,
        flushAt: 20,
        flushInterval: 10000,
      });
      this.logger.log('Service de tracking PostHog initialisé');
    } else {
      this.logger.warn('POSTHOG_KEY non trouvé');
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

    try {
      this.posthog.capture(params);
      this.logger.debug(`Event captured: ${params.event}`, {
        distinctId: params.distinctId,
        properties: params.properties,
      });
    } catch (error) {
      this.logger.error('Error capturing PostHog event', error);
    }
  }

  isEnabled(): boolean {
    return this.posthog !== null;
  }

  async onApplicationShutdown() {
    if (this.posthog) {
      await this.posthog.shutdown();
      this.logger.log('PostHog service shutdown');
    }
  }
}
