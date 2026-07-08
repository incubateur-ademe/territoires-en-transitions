'use client';

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
          children: 'Thématiques SGPE',
          onClick: () => setView('sgpe'),
        },
        {
          id: 'axes',
          icon: 'menu-line',
          children: 'Axes',
          onClick: () => setView('axes'),
        },
      ]}
    />
  );
}
