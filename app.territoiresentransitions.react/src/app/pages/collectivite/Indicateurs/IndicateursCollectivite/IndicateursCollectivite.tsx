import {FetchFiltre} from '@tet/api/dist/src/indicateurs';
import {ButtonMenu} from '@tet/ui';
import EmptyIndicateurFavori from 'app/pages/collectivite/Indicateurs/IndicateursCollectivite/EmptyIndicateurFavori';
import {useIndicateursFavorisCollectiviteIds} from 'app/pages/collectivite/Indicateurs/IndicateursCollectivite/useIndicateursFavorisCollectiviteIds';
import IndicateursListe from 'app/pages/collectivite/Indicateurs/lists/IndicateursListe';
import {indicateursNameToParams} from 'app/pages/collectivite/Indicateurs/lists/utils';
import MenuFiltresTousLesIndicateurs from 'app/pages/collectivite/Indicateurs/TousLesIndicateurs/MenuFiltresTousLesIndicateurs';
import {makeCollectiviteIndicateursCollectiviteUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useSearchParams} from 'core-logic/hooks/query';

/** Page de listing de tous les indicateurs de la collectivité */
const IndicateursCollectivite = () => {
  const collectiviteId = useCollectiviteId();

  const {data} = useIndicateursFavorisCollectiviteIds();

  const [filters, setFilters] = useSearchParams<FetchFiltre>(
    makeCollectiviteIndicateursCollectiviteUrl({
      collectiviteId: collectiviteId!,
    }),
    {},
    indicateursNameToParams
  );

  return (
    <div className="min-h-[44rem] flex flex-col gap-8">
      <div>
        <h2 className="mb-0">Indicateurs de la collectivité</h2>
      </div>
      {data?.count === 0 ? (
        <EmptyIndicateurFavori />
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
                }}
              />
            </ButtonMenu>
          )}
        />
      )}
    </div>
  );
};

export default IndicateursCollectivite;
