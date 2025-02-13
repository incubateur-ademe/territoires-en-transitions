'use client';

import { FetchFiltre } from '@/api/indicateurs';
import { useIndicateursFavorisCount } from '@/app/app/pages/collectivite/Indicateurs/data/use-indicateurs-favoris-count';
import EmptyIndicateurFavori from '@/app/app/pages/collectivite/Indicateurs/IndicateursCollectivite/EmptyIndicateurFavori';
import IndicateursListe from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list';
import { indicateursNameToParams } from '@/app/app/pages/collectivite/Indicateurs/lists/utils';
import MenuFiltresTousLesIndicateurs from '@/app/app/pages/collectivite/Indicateurs/TousLesIndicateurs/MenuFiltresTousLesIndicateurs';
import ModaleCreerIndicateur from '@/app/app/pages/collectivite/PlansActions/FicheAction/Indicateurs/ModaleCreerIndicateur';
import { makeCollectiviteIndicateursCollectiviteUrl } from '@/app/app/paths';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Button, ButtonMenu, TrackPageView, useEventTracker } from '@/ui';
import { pick } from 'es-toolkit';
import { useState } from 'react';
import { useCollectiviteId } from '../../../../../collectivites/collectivite-context';

/** Page de listing de tous les indicateurs de la collectivité */
const IndicateursCollectivite = () => {
  const tracker = useEventTracker('app/indicateurs/collectivite');

  const collectiviteId = useCollectiviteId();
  const collectivite = useCurrentCollectivite();

  const isReadonly = collectivite?.isReadOnly ?? false;

  const [isNewIndicateurOpen, setIsNewIndicateurOpen] = useState(false);

  const { data: count } = useIndicateursFavorisCount();

  const [filters, setFilters] = useSearchParams<FetchFiltre>(
    makeCollectiviteIndicateursCollectiviteUrl({
      collectiviteId,
    }),
    {},
    indicateursNameToParams
  );
  return (
    collectivite && (
      <>
        <TrackPageView
          pageName={'app/indicateurs/collectivite'}
          properties={pick(collectivite, [
            'collectiviteId',
            'niveauAcces',
            'role',
          ])}
        />
        <div className="min-h-[44rem] flex flex-col gap-8">
          <div className="flex items-end justify-between">
            <h2 className="mb-0">Indicateurs de la collectivité</h2>
            {!isReadonly && (
              <>
                <Button size="sm" onClick={() => setIsNewIndicateurOpen(true)}>
                  Créer un indicateur
                </Button>
                {isNewIndicateurOpen && (
                  <ModaleCreerIndicateur
                    isOpen={isNewIndicateurOpen}
                    setIsOpen={setIsNewIndicateurOpen}
                    isFavoriCollectivite
                  />
                )}
              </>
            )}
          </div>
          {!count ? (
            <EmptyIndicateurFavori />
          ) : (
            <IndicateursListe
              pageName="app/indicateurs/collectivite"
              isEditable
              filtres={{ ...filters, estFavorisCollectivite: true }}
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
                      setFilters(newFilters);
                      tracker('filtres', {
                        ...collectivite,
                        filtreValues: newFilters,
                      });
                    }}
                  />
                </ButtonMenu>
              )}
            />
          )}
        </div>
      </>
    )
  );
};

export default IndicateursCollectivite;
