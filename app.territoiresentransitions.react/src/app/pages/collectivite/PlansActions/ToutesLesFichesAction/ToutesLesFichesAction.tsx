import {Filtre} from '@tet/api/dist/src/fiche_actions/fiche_resumes.list/domain/fetch_options.schema';
import ModalFiltresToutesLesFichesAction from 'app/pages/collectivite/PlansActions/ToutesLesFichesAction/ModalFiltresToutesLesFichesAction';
import FichesActionListe from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/FichesActionListe';
import {makeCollectiviteToutesLesFichesUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useSearchParams} from 'core-logic/hooks/query';

// TODO: implémenter les filtres "sans" (ex. "sans_pilote")
const nameToparams: Record<keyof Filtre | 'sort' | 'page', string> = {
  statuts: 's',
  priorites: 'prio',
  modifiedSince: 'ms',
  texteNomOuDescription: 'text',
  budgetPrevisionnel: 'bp',
  restreint: 'r',
  hasIndicateurLies: 'il',
  planActionIds: 'pa',
  utilisateurPiloteIds: 'up',
  personnePiloteIds: 'pp',
  utilisateurReferentIds: 'ur',
  personneReferenteIds: 'pr',
  structurePiloteIds: 'sp',
  servicePiloteIds: 'sv',
  thematiqueIds: 't',
  financeurIds: 'f',
  page: 'p',
  sort: 'sort',
};

const ToutesLesFichesAction = () => {
  const collectiviteId = useCollectiviteId();

  const [filters, setFilters] = useSearchParams<Filtre>(
    makeCollectiviteToutesLesFichesUrl({collectiviteId: collectiviteId!}),
    {},
    nameToparams
  );

  return (
    <div className="min-h-[44rem] flex flex-col gap-8">
      <div>
        <h2 className="mb-0">Toutes les actions</h2>
      </div>
      <FichesActionListe
        defaultSort="titre"
        filtres={filters}
        settingsModal={openState => (
          <ModalFiltresToutesLesFichesAction
            openState={openState}
            filters={filters}
            setFilters={filters => setFilters(filters)}
          />
        )}
      />
    </div>
  );
};

export default ToutesLesFichesAction;
