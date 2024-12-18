import { Filtre } from '@/api/plan-actions/fiche-resumes.list/domain/fetch-options.schema';
import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import FichesActionListe from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/FichesActionListe';
import MenuFiltresToutesLesFichesAction from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/MenuFiltresToutesLesFichesAction';
import { makeCollectiviteToutesLesFichesUrl } from '@/app/app/paths';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Button, ButtonMenu, useEventTracker } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useFicheActionCount } from '../FicheAction/data/useFicheActionCount';

/** Paramètres d'URL possibles pour les filtres de fiches action */
export type FicheActionParam =
  | 's'
  | 'prio'
  | 'ms'
  | 'text'
  | 'bp'
  | 'r'
  | 'il'
  | 'fa'
  | 'pa'
  | 'ra'
  | 'up'
  | 'pp'
  | 'ur'
  | 'pt'
  | 'pr'
  | 'sp'
  | 'sv'
  | 'lt'
  | 't'
  | 'f'
  | 'c'
  | 'dd'
  | 'df'
  | 'ac'
  | 'p'
  | 'lfa'
  | 'sort'
  | 'ssp'
  | 'sssp'
  | 'sss'
  | 'tp'
  | 'dp'
  | 'fp'
  | 'pe'
  | 'st'
  | 'ea'
  | 'pc'
  | 'ax';

export const nameToparams: Record<
  keyof Filtre | 'sort' | 'page',
  FicheActionParam
> = {
  statuts: 's',
  priorites: 'prio',
  modifiedSince: 'ms',
  texteNomOuDescription: 'text',
  budgetPrevisionnel: 'bp',
  restreint: 'r',
  hasIndicateurLies: 'il',
  planActionIds: 'pa',
  ficheActionIds: 'fa',
  referentielActionIds: 'ra',
  linkedFicheActionIds: 'lfa',
  utilisateurPiloteIds: 'up',
  personnePiloteIds: 'pp',
  utilisateurReferentIds: 'ur',
  partenaireIds: 'pt',
  personneReferenteIds: 'pr',
  structurePiloteIds: 'sp',
  servicePiloteIds: 'sv',
  libreTagsIds: 'lt',
  thematiqueIds: 't',
  financeurIds: 'f',
  cibles: 'c',
  dateDebut: 'dd',
  dateFin: 'df',
  ameliorationContinue: 'ac',
  page: 'p',
  sort: 'sort',
  noPilote: 'ssp',
  noServicePilote: 'sssp',
  noStatut: 'sss',
  typePeriode: 'tp',
  debutPeriode: 'dp',
  finPeriode: 'fp',
  // Not supported for now in filters
  //piliersEci: 'pe',
  // sousThematiques: 'st',
  //effetsAttendus: 'ea',
  //participationCitoyenneType: 'pc',
  //axes: 'ax',
};

/** Page de listing de toutes les fiches actions de la collectivité */
const ToutesLesFichesAction = () => {
  const { collectiviteId, niveauAcces, role, isReadOnly } =
    useCurrentCollectivite()!;

  const { count } = useFicheActionCount();

  const [filterParams, setFilterParams] = useSearchParams<Filtre>(
    makeCollectiviteToutesLesFichesUrl({
      collectiviteId,
    }),
    {},
    nameToparams
  );

  const filters = convertParamsToFilters(filterParams);

  const { mutate: createFicheAction } = useCreateFicheAction();
  const tracker = useEventTracker('app/toutes-les-fiches-action');

  return (
    <div className="min-h-[44rem] flex flex-col gap-8">
      <div className="flex justify-between max-sm:flex-col gap-y-4">
        <h2 className="mb-0">Toutes les actions</h2>
        {!isReadOnly && !!count && (
          <Button size="sm" onClick={() => createFicheAction()}>
            Créer une fiche d’action
          </Button>
        )}
      </div>
      <FichesActionListe
        filtres={filters}
        resetFilters={() => setFilterParams({})}
        sortSettings={{
          defaultSort: 'titre',
        }}
        settings={(openState: OpenState) => (
          <ButtonMenu
            openState={openState}
            variant="outlined"
            icon="equalizer-line"
            size="sm"
            text="Filtrer"
          >
            <MenuFiltresToutesLesFichesAction
              filters={filters}
              setFilters={(filters) => {
                setFilterParams(filters);
                tracker('filtres', {
                  collectiviteId,
                  niveauAcces,
                  role,
                  filtreValues: filters,
                });
              }}
            />
          </ButtonMenu>
        )}
        enableGroupedActions={!isReadOnly}
        isReadOnly={isReadOnly}
        displayEditionMenu
      />
    </div>
  );
};

export default ToutesLesFichesAction;

/** Converti les paramètres d'URL en filtres */
const convertParamsToFilters = (paramFilters: Filtre) => {
  if (paramFilters.modifiedSince && Array.isArray(paramFilters.modifiedSince)) {
    paramFilters.modifiedSince = paramFilters.modifiedSince[0];
  }
  if (paramFilters.dateDebut && Array.isArray(paramFilters.dateDebut)) {
    paramFilters.dateDebut = paramFilters.dateDebut[0];
  }
  if (paramFilters.dateFin && Array.isArray(paramFilters.dateFin)) {
    paramFilters.dateFin = paramFilters.dateFin[0];
  }
  if (paramFilters.typePeriode && Array.isArray(paramFilters.typePeriode)) {
    paramFilters.typePeriode = paramFilters.typePeriode[0];
  }
  if (paramFilters.debutPeriode && Array.isArray(paramFilters.debutPeriode)) {
    paramFilters.debutPeriode = paramFilters.debutPeriode[0];
  }
  if (paramFilters.finPeriode && Array.isArray(paramFilters.finPeriode)) {
    paramFilters.finPeriode = paramFilters.finPeriode[0];
  }
  return paramFilters;
};
