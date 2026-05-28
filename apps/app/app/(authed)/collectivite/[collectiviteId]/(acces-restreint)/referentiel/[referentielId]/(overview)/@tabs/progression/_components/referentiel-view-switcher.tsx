'use client';

import { appLabels } from '@/app/labels/catalog';
import { ReferentielTableWithData } from '@/app/referentiels/referentiel.table/referentiel-table';
import { useReferentielViewMode } from '@/app/referentiels/referentiel.table/use-referentiel-view-mode';
import { Alert, InlineLink } from '@tet/ui';
import ActionList from './action.list';

export const ReferentielViewSwitcher = () => {
  const { mode, setMode } = useReferentielViewMode();

  if (mode === 'legacy') {
    return (
      <div className="flex flex-col gap-6">
        <Alert
          state="info"
          title={
            <div className="flex items-center gap-4">
              <span>{appLabels.nouvelleVueTableauDisponible}</span>
              <InlineLink href="#" onClick={() => setMode('table')}>
                {appLabels.decouvrirVueTabulaire}
              </InlineLink>
            </div>
          }
        />
        <ActionList />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Alert
        state="info"
        title={
          <div className="flex gap-4">
            <span>{appLabels.utiliseNouvelleVueTableauBeta}</span>
            <InlineLink href="#" onClick={() => setMode('legacy')}>
              {appLabels.revenirVueGrille}
            </InlineLink>
          </div>
        }
      />
      <ReferentielTableWithData />
    </div>
  );
};
