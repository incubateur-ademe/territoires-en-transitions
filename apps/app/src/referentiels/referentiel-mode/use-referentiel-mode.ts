import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  isCollectiviteReferentielPreferenceId,
  type ReferentielMode,
} from '@tet/domain/collectivites';

export function useReferentielMode(): ReferentielMode | null {
  const referentielId = useReferentielId();
  const { collectivitePreferences } = useCurrentCollectivite();

  if (!isCollectiviteReferentielPreferenceId(referentielId)) {
    return null;
  }

  return collectivitePreferences?.referentiels?.[referentielId]?.mode ?? null;
}
