import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import type {
  CollectiviteReferentielDisplayId,
  ReferentielMode,
} from '@tet/domain/collectivites';

const referentielIdsWithMode: CollectiviteReferentielDisplayId[] = [
  'cae',
  'eci',
  'te',
];

export function useReferentielMode(): ReferentielMode | null {
  const referentielId = useReferentielId();
  const { collectivitePreferences } = useCurrentCollectivite();

  if (referentielId === 'te-test') {
    return null;
  }

  if (
    !referentielIdsWithMode.includes(
      referentielId as CollectiviteReferentielDisplayId
    )
  ) {
    return null;
  }

  const referentielPrefs =
    collectivitePreferences?.referentiels?.[
      referentielId as CollectiviteReferentielDisplayId
    ];

  if (!referentielPrefs) {
    return null;
  }

  return referentielPrefs.mode;
}
