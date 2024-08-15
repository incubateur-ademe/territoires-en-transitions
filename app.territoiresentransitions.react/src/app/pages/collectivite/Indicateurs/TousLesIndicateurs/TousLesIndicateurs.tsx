import {FetchFiltre} from '@tet/api/dist/src/indicateurs';
import IndicateursListe from 'app/pages/collectivite/Indicateurs/lists/IndicateursListe';
import ModalFiltresTousLesIndicateurs from 'app/pages/collectivite/Indicateurs/TousLesIndicateurs/ModalFiltresTousLesIndicateurs';
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
        settingsModal={openState => (
          <ModalFiltresTousLesIndicateurs
            openState={openState}
            filters={filters}
            setFilters={newFilters => {
              setFilters(newFilters);
            }}
          />
        )}
      />
    </div>
  );
};

export default TousLesIndicateurs;
