import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  isCollectiviteReferentielPreferenceId,
  type ReferentielMode,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';

/**
 * Variante ne dépendant pas du `ReferentielProvider` : à utiliser quand le
 * référentiel concerné n'est pas celui du contexte courant (ex. discussions
 * rattachées à une action d'un autre référentiel).
 */
export function useReferentielModeById(
  referentielId: ReferentielId | null | undefined
): ReferentielMode | null {
  const { collectivitePreferences } = useCurrentCollectivite();

  if (
    !referentielId ||
    !isCollectiviteReferentielPreferenceId(referentielId)
  ) {
    return null;
  }

  return collectivitePreferences?.referentiels?.[referentielId]?.mode ?? null;
}

export function useReferentielMode(): ReferentielMode | null {
  const referentielId = useReferentielId();
  return useReferentielModeById(referentielId);
}
