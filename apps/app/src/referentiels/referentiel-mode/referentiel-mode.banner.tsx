'use client';

import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import { ReferentielModeArchivedBanner } from './referentiel-mode-archived.banner';
import { ReferentielModeReadonlyBanner } from './referentiel-mode-readonly.banner';
import { SwitchToTeBanner } from '../switch-to-te.banner/switch-to-te.banner';
import { useReferentielMode } from './use-referentiel-mode';

export const ReferentielModeBanner = () => {
  const referentielId = useReferentielId();
  const mode = useReferentielMode();
  const isVisitor = useIsVisitor();

  if (!mode || isVisitor) {
    return null;
  }

  // le référentiel TE en lecture seule a ses propres variantes de bandeau
  // selon l'éligibilité / les blocages à la bascule (COT, audit, droits…).
  if (referentielId === 'te' && mode === 'readonly') {
    return <SwitchToTeBanner />;
  }

  if (mode === 'readonly') {
    return <ReferentielModeReadonlyBanner />;
  }

  if (mode === 'archived') {
    return <ReferentielModeArchivedBanner />;
  }

  return null;
};
