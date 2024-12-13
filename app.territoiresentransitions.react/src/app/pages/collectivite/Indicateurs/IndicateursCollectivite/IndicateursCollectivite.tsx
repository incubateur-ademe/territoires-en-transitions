import { FetchFiltre } from '@/api/indicateurs';
import EmptyIndicateurFavori from '@/app/app/pages/collectivite/Indicateurs/IndicateursCollectivite/EmptyIndicateurFavori';
import { useIndicateursFavorisCollectiviteIds } from '@/app/app/pages/collectivite/Indicateurs/IndicateursCollectivite/useIndicateursFavorisCollectiviteIds';
import IndicateursListe from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list';
import { indicateursNameToParams } from '@/app/app/pages/collectivite/Indicateurs/lists/utils';
import MenuFiltresTousLesIndicateurs from '@/app/app/pages/collectivite/Indicateurs/TousLesIndicateurs/MenuFiltresTousLesIndicateurs';
import ModaleCreerIndicateur from '@/app/app/pages/collectivite/PlansActions/FicheAction/Indicateurs/ModaleCreerIndicateur';
import { makeCollectiviteIndicateursCollectiviteUrl } from '@/app/app/paths';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Button, ButtonMenu, TrackPageView, useEventTracker } from '@/ui';
import { useState } from 'react';

/** Page de listing de tous les indicateurs de la collectivité */
const IndicateursCollectivite = () => {
  const tracker = useEventTracker('app/indicateurs/collectivite');

  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectivite_id;

  const isReadonly = collectivite?.readonly ?? false;

  const [isNewIndicateurOpen, setIsNewIndicateurOpen] = useState(false);

  const { data } = useIndicateursFavorisCollectiviteIds();

  const [filters, setFilters] = useSearchParams<FetchFiltre>(
    makeCollectiviteIndicateursCollectiviteUrl({
      collectiviteId: collectiviteId!,
    }),
    {},
    indicateursNameToParams
  );

  return (
    <>
      <TrackPageView
        pageName={'app/indicateurs/collectivite'}
        properties={{ collectivite_id: collectiviteId! }}
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
        {data?.count === 0 ? (
          <EmptyIndicateurFavori
            collectiviteId={collectiviteId!}
            isReadonly={isReadonly}
          />
        ) : (
          <IndicateursListe
            pageName="app/indicateurs/collectivite"
            isEditable
            filtres={{ ...filters, estFavorisCollectivite: true }}
            resetFilters={() => setFilters({})}
            sortSettings={{ defaultSort: 'text' }}
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
                      collectivite_id: collectiviteId!,
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
  );
};

export default IndicateursCollectivite;
