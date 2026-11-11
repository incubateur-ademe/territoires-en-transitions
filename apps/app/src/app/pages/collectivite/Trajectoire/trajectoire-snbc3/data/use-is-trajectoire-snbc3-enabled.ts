import { ENV } from '@tet/api/environmentVariables';
import { useCollectiviteId } from '@tet/api/collectivites';
import { FeatureFlagKey } from '@tet/domain/utils';
import { useFeatureFlagEnabled, usePostHog } from 'posthog-js/react';
import { useLayoutEffect, useState } from 'react';

const FLAG: FeatureFlagKey = 'is-trajectoire-snbc3-enabled';

/**
 * Valeur du flag pour la collectivité courante, `undefined` tant qu'elle n'est
 * pas connue. `flagsEvaluatedFor` est le groupe `collectivite` PostHog actif
 * quand les flags ont été reçus : des flags reçus pour une autre collectivité
 * ne disent rien de celle-ci.
 */
export function getTrajectoireSnbc3FlagState({
  isForced,
  hasClient,
  collectiviteId,
  flagsEvaluatedFor,
  flag,
}: {
  isForced: boolean;
  hasClient: boolean;
  collectiviteId: number;
  flagsEvaluatedFor: string | undefined;
  flag: boolean | undefined;
}): boolean | undefined {
  if (isForced) {
    return true;
  }
  if (!hasClient) {
    return false;
  }
  return flagsEvaluatedFor === String(collectiviteId)
    ? flag === true
    : undefined;
}

/**
 * Vrai si PostHog va renvoyer d'autres flags : rechargement planifié, requête
 * en cours, ou rechargement demandé pendant une requête. Dans ce dernier cas,
 * la réponse qui arrive a été calculée pour l'ancien groupe alors que
 * `getGroups()` renvoie déjà le nouveau : il faut attendre la suivante.
 *
 * Lit l'état interne de `posthog.featureFlags` (`@posthog/browser-common`),
 * faute d'API publique. Si ces champs disparaissent, renvoie `false` : on
 * retombe sur la seule comparaison des groupes.
 */
export function isFlagsReloadPending(featureFlags: unknown): boolean {
  if (typeof featureFlags !== 'object' || featureFlags === null) {
    return false;
  }
  const state = featureFlags as {
    _reloadDebouncer?: unknown;
    _requestInFlight?: unknown;
    _additionalReloadRequested?: unknown;
  };
  return Boolean(
    state._reloadDebouncer ||
      state._requestInFlight ||
      state._additionalReloadRequested
  );
}

/**
 * Flag SNBC 3 de la page Trajectoire, avec un état « pas encore connu »
 * (`undefined`). `useIsFeatureFlagEnabled` renvoie `false` tant que PostHog
 * n'a pas chargé les flags : l'ancienne page s'afficherait un instant et
 * lancerait le calcul SNBC 2, ce que le lot 3 doit éviter.
 *
 * Le flag dépend de la collectivité (groupe PostHog `collectivite`, posé par
 * `PostHogPageView` depuis le paramètre d'URL). Après une navigation depuis
 * une autre collectivité, les flags déjà chargés valent pour l'ancienne : on
 * attend que `posthog.group` (qui recharge les flags quand le groupe change)
 * ait renvoyé ceux de la collectivité courante. L'abonnement se fait dans un
 * `useLayoutEffect`, avant l'effet de `PostHogPageView` du même rendu : le
 * rappel immédiat d'`onFeatureFlags` voit encore l'ancien groupe et ne compte
 * pas. Un rappel reçu alors qu'un rechargement est en attente
 * (`isFlagsReloadPending`) ne compte pas non plus : ses flags peuvent valoir
 * pour l'ancien groupe.
 *
 * Réservé aux pages d'une collectivité (`useCollectiviteId` lève une erreur
 * sinon) : le groupe y est toujours posé, le chargement ne reste pas bloqué.
 *
 * Toujours actif en dev et en CI, comme `useIsFeatureFlagEnabled`. Sans client
 * PostHog (clé absente), le flag est inactif.
 */
export function useIsTrajectoireSnbc3Enabled(): boolean | undefined {
  const posthog = usePostHog();
  const collectiviteId = useCollectiviteId();
  const isForced =
    ENV.application_env === 'dev' || ENV.application_env === 'ci';
  const hasClient = Boolean(posthog?.__loaded);
  const flag = useFeatureFlagEnabled(FLAG);
  const [flagsEvaluatedFor, setFlagsEvaluatedFor] = useState<string>();

  useLayoutEffect(() => {
    if (isForced || !hasClient) {
      return;
    }
    // appelé tout de suite si les flags sont déjà chargés, y compris en échec,
    // puis à chaque rechargement (dont celui déclenché par `posthog.group`)
    return posthog.onFeatureFlags(() => {
      if (!isFlagsReloadPending(posthog.featureFlags)) {
        setFlagsEvaluatedFor(posthog.getGroups()?.collectivite);
      }
    });
  }, [posthog, isForced, hasClient]);

  return getTrajectoireSnbc3FlagState({
    isForced,
    hasClient,
    collectiviteId,
    flagsEvaluatedFor,
    flag,
  });
}
