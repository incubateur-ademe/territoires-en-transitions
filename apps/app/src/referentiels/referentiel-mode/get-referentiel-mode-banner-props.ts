import { appLabels } from '@/app/labels/catalog';
import {
  canMutateReferentielData,
  type ReferentielMode,
} from '@tet/domain/collectivites';
import type { ReferentielId } from '@tet/domain/referentiels';

export type ReferentielModeBannerProps = {
  title: string;
  description: string;
  state: 'info' | 'warning';
};

export function getReferentielModeBannerProps({
  referentielId,
  mode,
}: {
  referentielId: ReferentielId;
  mode: ReferentielMode;
}): ReferentielModeBannerProps | null {
  if (canMutateReferentielData(mode)) {
    return null;
  }

  if (mode === 'readonly') {
    if (referentielId === 'te') {
      return {
        title: appLabels.referentielModeReadonlyTitle,
        description: appLabels.referentielTeModeReadonlyDescription,
        state: 'info',
      };
    }
    return {
      title: appLabels.referentielModeReadonlyTitle,
      description: appLabels.referentielModeReadonlydDescription,
      state: 'info',
    };
  }

  if (mode === 'archived') {
    return {
      title: appLabels.referentielModeArchivedTitle,
      description: appLabels.referentielModeArchivedDescription,
      state: 'warning',
    };
  }

  return null;
}
