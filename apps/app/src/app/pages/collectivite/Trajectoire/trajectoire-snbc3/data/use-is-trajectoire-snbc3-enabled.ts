import { useFeatureFlagState } from '@/app/utils/posthog/use-is-feature-flag-enabled';

/**
 * Flag SNBC 3 de la page Trajectoire, `undefined` tant qu'il n'est pas connu :
 * l'ancienne page ne doit pas s'afficher un instant ni lancer le calcul SNBC 2
 * avant que le flag soit chargé.
 *
 * Le flag dépend de la collectivité. Les flags étant chargés par collectivité,
 * il reste `undefined` après une navigation vers une autre collectivité, le
 * temps de recevoir les siens.
 */
export function useIsTrajectoireSnbc3Enabled(): boolean | undefined {
  return useFeatureFlagState('is-trajectoire-snbc3-enabled');
}
