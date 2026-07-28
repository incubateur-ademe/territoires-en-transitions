'use client';

import { appLabels } from '@/app/labels/catalog';
import { isNewReferentiel } from '@tet/domain/referentiels';
import { ButtonGroup } from '@tet/ui';
import { useReferentielId } from '../referentiel-context';
import { useReferentielThematiqueView } from './use-referentiel-thematique-view';

export function ReferentielTableThematiquesViews() {
  const referentielId = useReferentielId();
  const { view, setView } = useReferentielThematiqueView();

  if (!isNewReferentiel(referentielId)) {
    return null;
  }

  return (
    <ButtonGroup
      className="grow-0"
      size="sm"
      activeButtonId={view}
      buttons={[
        {
          id: 'sgpe',
          icon: 'menu-line',
          children: appLabels.referentielTableThematiquesViewsSgpe,
          onClick: () => setView('sgpe'),
        },
        {
          id: 'axes',
          icon: 'menu-line',
          children: appLabels.referentielTableThematiquesViewsAxes,
          onClick: () => setView('axes'),
        },
      ]}
    />
  );
}
