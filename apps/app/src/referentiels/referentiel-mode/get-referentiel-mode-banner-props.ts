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
  link?: string;
  linkLabel?: string;
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
        title: appLabels.referentielTeModeReadonlyTitle,
        description: appLabels.referentielTeModeReadonlyDescription,
        link: 'https://aide.territoiresentransitions.fr/fr/article/nouveau-referentiel-climat-ressources-faq-1751rib/',
        linkLabel: appLabels.referentielTeModeReadonlyLinkLabel,
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
