'use client';

import { FetchFiltre } from '@/api/indicateurs';
import IndicateursListe from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list';
import { indicateursNameToParams } from '@/app/app/pages/collectivite/Indicateurs/lists/utils';
import MenuFiltresTousLesIndicateurs from '@/app/app/pages/collectivite/Indicateurs/TousLesIndicateurs/MenuFiltresTousLesIndicateurs';
import ModaleCreerIndicateur from '@/app/app/pages/collectivite/PlansActions/FicheAction/Indicateurs/ModaleCreerIndicateur';
import { makeCollectiviteTousLesIndicateursUrl } from '@/app/app/paths';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Button, ButtonMenu, TrackPageView, useEventTracker } from '@/ui';
import { pick } from 'es-toolkit';
import { useState } from 'react';
import { useCollectiviteId } from '../../../../../collectivites/collectivite-context';

/** Page de listing de toutes les fiches actions de la collectivité */
const TousLesIndicateurs = () => {
  const collectiviteId = useCollectiviteId();
  const collectivite = useCurrentCollectivite();

  const tracker = useEventTracker('app/indicateurs/tous');

  const isReadonly = collectivite?.isReadOnly ?? false;

  const [isNewIndicateurOpen, setIsNewIndicateurOpen] = useState(false);

  const [filters, setFilters] = useSearchParams<FetchFiltre>(
    makeCollectiviteTousLesIndicateursUrl({
      collectiviteId,
    }),
    {},
    indicateursNameToParams
  );

  const handleSetFilters = (newFilters: FetchFiltre) => {
    setFilters(newFilters);
    if (collectivite) {
      tracker('filtres', {
        ...collectivite,
        filtreValues: newFilters,
      });
    }
  };

  return (
    collectivite && (
      <>
        <TrackPageView
          pageName={'app/indicateurs/tous'}
          properties={pick(collectivite, [
            'collectiviteId',
            'niveauAcces',
            'role',
          ])}
        />
        <div
          className="min-h-[44rem] flex flex-col gap-8"
          data-test="tous-les-indicateurs"
        >
          <div className="flex justify-between max-sm:flex-col gap-y-4">
            <h2 className="mb-0 mr-auto">Tous les indicateurs</h2>
            {!isReadonly && (
              <>
                <Button
                  data-test="create-perso"
                  size="sm"
                  onClick={() => setIsNewIndicateurOpen(true)}
                >
                  Créer un indicateur
                </Button>
                {isNewIndicateurOpen && (
                  <ModaleCreerIndicateur
                    isOpen={isNewIndicateurOpen}
                    setIsOpen={setIsNewIndicateurOpen}
                  />
                )}
              </>
            )}
          </div>
          <IndicateursListe
            pageName="app/indicateurs/tous"
            isEditable
            filtres={filters}
            resetFilters={() => setFilters({})}
            sortSettings={{ defaultSort: 'estComplet' }}
            settings={(openState) => (
              <ButtonMenu
                openState={openState}
                variant="outlined"
                icon="equalizer-line"
                size="sm"
                text="Filtrer"
              >
                <MenuFiltresTousLesIndicateurs
                  filters={filters}
                  setFilters={(newFilters) => {
                    handleSetFilters(newFilters);
                  }}
                />
              </ButtonMenu>
            )}
          />
        </div>
      </>
    )
  );
};

export default TousLesIndicateurs;
