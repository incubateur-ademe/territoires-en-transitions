import {useState} from 'react';
import {FetchFiltre} from '@tet/api/dist/src/indicateurs';
import {Button, ButtonMenu, TrackPageView, useEventTracker} from '@tet/ui';
import EmptyIndicateurFavori from 'app/pages/collectivite/Indicateurs/IndicateursCollectivite/EmptyIndicateurFavori';
import {useIndicateursFavorisCollectiviteIds} from 'app/pages/collectivite/Indicateurs/IndicateursCollectivite/useIndicateursFavorisCollectiviteIds';
import IndicateursListe from 'app/pages/collectivite/Indicateurs/lists/IndicateursListe';
import {indicateursNameToParams} from 'app/pages/collectivite/Indicateurs/lists/utils';
import MenuFiltresTousLesIndicateurs from 'app/pages/collectivite/Indicateurs/TousLesIndicateurs/MenuFiltresTousLesIndicateurs';
import {makeCollectiviteIndicateursCollectiviteUrl} from 'app/paths';
import {useSearchParams} from 'core-logic/hooks/query';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import ModaleCreerIndicateur from 'app/pages/collectivite/PlansActions/FicheAction/Indicateurs/ModaleCreerIndicateur';

/** Page de listing de tous les indicateurs de la collectivité */
const IndicateursCollectivite = () => {
  const tracker = useEventTracker('app/indicateurs/collectivite');

  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectivite_id;

  const isReadonly = collectivite?.readonly ?? false;

  const [isNewIndicateurOpen, setIsNewIndicateurOpen] = useState(false);

  const {data} = useIndicateursFavorisCollectiviteIds();

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
        properties={{collectivite_id: collectiviteId!}}
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
            isEditable
            filtres={{...filters, estFavorisCollectivite: true}}
            resetFilters={() => setFilters({})}
            sortSettings={{defaultSort: 'estComplet'}}
            settings={openState => (
              <ButtonMenu
                openState={openState}
                variant="outlined"
                icon="equalizer-line"
                size="sm"
              >
                <MenuFiltresTousLesIndicateurs
                  filters={filters}
                  setFilters={newFilters => {
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
