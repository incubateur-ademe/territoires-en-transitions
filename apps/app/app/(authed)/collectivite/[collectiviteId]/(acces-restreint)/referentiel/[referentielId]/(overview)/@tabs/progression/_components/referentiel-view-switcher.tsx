'use client';

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
              <span>Une nouvelle vue tableau est disponible</span>
              <InlineLink href="#" onClick={() => setMode('table')}>
                Découvrir la vue tabulaire
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
            <span>Vous utilisez la nouvelle vue tableau (version bêta)</span>
            <InlineLink href="#" onClick={() => setMode('legacy')}>
              Revenir à la vue Grille
            </InlineLink>
            {/* <Button size="sm" variant="grey" onClick={() => setMode('legacy')}>
              Revenir à la vue Grille
            </Button> */}
          </div>
        }
      />
      <ReferentielTableWithData />
    </div>
  );
};
