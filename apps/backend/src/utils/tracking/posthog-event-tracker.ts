import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { FeatureFlagKey } from '@tet/domain/utils';
import { PostHog } from 'posthog-node';
import {
  EventTracker,
  FeatureFlagEvaluationOptions,
  FeatureFlags,
  ListFeatureFlagsParams,
  TrackedEvent,
} from './event-tracker.interface';
import {
  buildUniformFeatureFlags,
  toFeatureFlags,
} from './list-feature-flags.rules';

/** En dev, en test et en CI, les flags sont actifs sans passer par PostHog. */
function isFeatureFlagForced(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test' ||
    process.env.ENV_NAME === 'dev' ||
    process.env.ENV_NAME === 'ci'
  );
}

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
      const envName = this.configurationService.get('ENV_NAME');
      this.posthog = new PostHog(postHogKey, {
        host: postHogHost,
        flushAt: 20,
        flushInterval: 10_000,
        featureFlagsPollingInterval: 60_000,
        // Comme le faisait posthog-js : un flag tagué par environnement dans
        // PostHog n'est évalué que si la requête porte ce contexte.
        evaluationContexts: envName ? [envName] : undefined,
      });
      // posthog-node avale ses erreurs réseau (flags, envoi d'événements) et
      // ne les signale que par cet événement.
      this.posthog.on('error', (error) => {
        this.logger.warn('Erreur PostHog', error);
      });
      this.logger.log('Tracking PostHog initialisé');
    } else {
      this.logger.warn('POSTHOG_KEY non trouvée');
    }
  }

  capture(params: TrackedEvent) {
    if (!this.posthog) {
      return;
    }

    this.posthog.capture({
      ...params,
      properties: {
        ...params.properties,
        environment: this.configurationService.get('ENV_NAME') || 'local',
      },
    });
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

  async isFeatureEnabled(
    featureFlagKey: FeatureFlagKey,
    userId: string,
    collectiviteId?: number,
    options: FeatureFlagEvaluationOptions = {}
  ): Promise<boolean> {
    if (!options.requireExplicitActivation && isFeatureFlagForced()) {
      return true;
    }

    if (!this.posthog) {
      return false;
    }

    const isFlagEnabled = await this.posthog.isFeatureEnabled(
      featureFlagKey,
      userId,
      collectiviteId
        ? {
            groups: {
              collectivite: `${collectiviteId}`,
            },
          }
        : undefined
    );

    return isFlagEnabled || false;
  }

  /**
   * Tous les flags de l'application pour un utilisateur, évalués ici plutôt
   * que dans le navigateur : l'appel du navigateur vers PostHog peut être
   * bloqué (adblocker, pare-feu de la collectivité), celui du serveur non.
   *
   * Même forçage en dev/test/CI que `isFeatureEnabled`. Sans client PostHog
   * (clé absente), tous les flags sont inactifs.
   *
   * Lève une erreur si PostHog n'a pas répondu : posthog-node ne lève rien
   * (panne, timeout, quota dépassé) et renvoie `{}`, qu'on ne doit pas confondre
   * avec « tous les flags inactifs » — le navigateur garderait ce résultat en
   * cache au lieu des flags qu'il avait déjà. Une réponse réussie contient
   * toujours les flags actifs du projet, même évalués à `false`.
   */
  async listFeatureFlags({
    userId,
    email,
    collectiviteId,
  }: ListFeatureFlagsParams): Promise<FeatureFlags> {
    if (isFeatureFlagForced()) {
      return buildUniformFeatureFlags(true);
    }

    if (!this.posthog) {
      return buildUniformFeatureFlags(false);
    }

    const values = await this.posthog.getAllFlags(userId, {
      groups: collectiviteId ? { collectivite: `${collectiviteId}` } : undefined,
      personProperties: email ? { email } : undefined,
    });
    if (Object.keys(values).length === 0) {
      throw new Error('PostHog n’a renvoyé aucun feature flag');
    }
    return toFeatureFlags(values);
  }

  async onApplicationShutdown() {
    await this.shutdown();
  }
}
