import { useCurrentCollectivite } from '@/api/collectivites';
import { PermissionLevel } from '@/domain/auth';
import { useParams } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { EventName, PageName, TrackingPlan } from './trackingPlan';

/**
 * Le tracker d'événement d'une page.
 *
 * le typage permet de respecter le plan de tracking.
 */
type PageEventTracker<N extends PageName> = <
  E extends TrackingPlan[N]['events'],
  P extends TrackingPlan[N]['properties'],
  K extends string & keyof TrackingPlan[N]['events']
>(
  event: K,
  properties: E[K] & P
) => Promise<void>;

/**
 * Renvoi le tracker pour enregistrer les évenements d'une page
 */
export function useEventTracker() {
  const posthog = usePostHog();
  const params = useParams();

  let collectiviteId: number | undefined;
  let niveauAcces: PermissionLevel | null | undefined;
  let role: 'auditeur' | null | undefined;

  try {
    const collectivite = useCurrentCollectivite();
    collectiviteId = collectivite.collectiviteId;
    niveauAcces = collectivite.niveauAcces;
    role = collectivite.role;
  } catch (error) {
    console.error('useEventTracker: collectiviteId is not defined');
  }

  return (event: EventName, properties?: Record<string, unknown>) =>
    posthog?.capture(event, {
      ...params,
      ...(properties ?? {}),
      ...(collectiviteId !== undefined && { collectiviteId }),
      ...(niveauAcces !== undefined && { niveauAcces }),
      ...(role !== undefined && { role }),
    });
}
