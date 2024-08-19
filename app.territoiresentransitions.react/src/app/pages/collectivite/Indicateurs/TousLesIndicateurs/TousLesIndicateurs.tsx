import {FetchFiltre} from '@tet/api/dist/src/indicateurs';
import {ButtonMenu} from '@tet/ui';
import IndicateursListe from 'app/pages/collectivite/Indicateurs/lists/IndicateursListe';
import MenuFiltresTousLesIndicateurs from 'app/pages/collectivite/Indicateurs/TousLesIndicateurs/MenuFiltresTousLesIndicateurs';
import {makeCollectiviteTousLesIndicateursUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useSearchParams} from 'core-logic/hooks/query';

const nameToParams: Record<keyof FetchFiltre, string> = {
  thematiqueIds: 't',
  actionId: 'a',
  planActionIds: 'pa',
  utilisateurPiloteIds: 'up',
  personnePiloteIds: 'pp',
  servicePiloteIds: 's',
  categorieNoms: 'cat',
  participationScore: 'ps',
  estComplet: 'r',
  estConfidentiel: 'c',
  fichesNonClassees: 'fnc',
  text: 'text',
  estPerso: 'p',
  hasOpenData: 'od',
};

/** Page de listing de toutes les fiches actions de la collectivité */
const TousLesIndicateurs = () => {
  const collectiviteId = useCollectiviteId();

  const [filters, setFilters] = useSearchParams<FetchFiltre>(
    makeCollectiviteTousLesIndicateursUrl({collectiviteId: collectiviteId!}),
    {},
    nameToParams
  );

  return (
    <div className="min-h-[44rem] flex flex-col gap-8">
      <div>
        <h2 className="mb-0">Tous les indicateurs</h2>
      </div>
      <IndicateursListe
        filtres={filters}
        sortSettings={{defaultSort: 'estComplet'}}
        settings={openState => (
          <ButtonMenu
            openState={openState}
            variant="outlined"
            icon="equalizer-line"
            size="sm"
          >
            <MenuFiltresTousLesIndicateurs
              openState={openState}
              filters={filters}
              setFilters={newFilters => {
                setFilters(newFilters);
              }}
            />
          </ButtonMenu>
        )}
      />
    </div>
  );
};

export default TousLesIndicateurs;
