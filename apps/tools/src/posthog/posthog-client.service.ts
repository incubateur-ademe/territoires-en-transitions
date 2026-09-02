import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { PostHog } from 'posthog-node';
import ConfigurationService from '../config/configuration.service';

export type GroupProperties = Record<
  string,
  string | number | boolean | null
>;

/**
 * Fin wrapper autour du client `posthog-node`, calqué sur
 * `apps/backend/src/utils/tracking/posthog-event-tracker.ts` : initialisation
 * conditionnelle (pas de `POSTHOG_KEY`/`POSTHOG_HOST` → no-op), flush explicite
 * pour les traitements batch, fermeture propre au shutdown.
 */
@Injectable()
export class PostHogClientService implements OnApplicationShutdown {
  private readonly logger = new Logger(PostHogClientService.name);
  private readonly posthog: PostHog | null = null;

  constructor(private readonly configurationService: ConfigurationService) {
    const postHogKey = this.configurationService.get('POSTHOG_KEY');
    const postHogHost = this.configurationService.get('POSTHOG_HOST');
    if (postHogKey && postHogHost) {
      this.posthog = new PostHog(postHogKey, {
        host: postHogHost,
        flushAt: 100,
        flushInterval: 10_000,
        // Borne la taille de chaque requête HTTP `/batch` : les endpoints
        // d'ingestion PostHog ne sont pas rate-limités mais le corps de
        // requête doit rester < 20 Mo. 1 000 `$groupidentify` ≈ ≤ 1 Mo.
        maxBatchSize: 1000,
      });
      this.logger.log('Client PostHog initialisé');
    } else {
      this.logger.warn(
        'POSTHOG_KEY / POSTHOG_HOST non trouvées : synchro PostHog désactivée'
      );
    }
  }

  isEnabled(): boolean {
    return this.posthog !== null;
  }

  /**
   * Émet un évènement `$groupidentify` (cf.
   * https://posthog.com/docs/api/capture#group-identify) : `$set` (merge) des
   * propriétés sur le groupe, sans toucher aux clés non envoyées.
   */
  groupIdentify(
    groupType: string,
    groupKey: string | number,
    properties: GroupProperties
  ): void {
    this.posthog?.groupIdentify({
      groupType,
      groupKey: String(groupKey),
      properties,
    });
  }

  async flush(): Promise<void> {
    await this.posthog?.flush();
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.posthog) {
      await this.posthog.shutdown();
      this.logger.log('Arrêt du client PostHog');
    }
  }
}
