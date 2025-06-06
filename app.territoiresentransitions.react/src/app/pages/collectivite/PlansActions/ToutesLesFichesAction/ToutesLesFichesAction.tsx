import { useCurrentCollectivite } from '@/api/collectivites';
import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import FichesActionListe from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/FichesActionListe';
import MenuFiltresToutesLesFichesAction from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/MenuFiltresToutesLesFichesAction';
import { makeCollectiviteToutesLesFichesUrl } from '@/app/app/paths';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { ListFichesRequestFilters as Filtres } from '@/domain/plans/fiches';
import { Button, ButtonMenu, Event, useEventTracker } from '@/ui';
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
  | 'i'
  | 'il'
  | 'ml'
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
  | 'lf'
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
  | 'ax'
  | 'np'
  | 'npr'
  | 'ma'
  | 'nr';

export const nameToparams: Record<
  keyof Filtres | 'sort' | 'page',
  FicheActionParam
> = {
  statuts: 's',
  priorites: 'prio',
  modifiedSince: 'ms',
  texteNomOuDescription: 'text',
  hasBudgetPrevisionnel: 'bp',
  restreint: 'r',
  hasIndicateurLies: 'il',
  hasMesuresLiees: 'ml',
  planActionIds: 'pa',
  ficheIds: 'fa',
  mesureIds: 'ra',
  linkedFicheIds: 'lf',
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
  indicateurIds: 'i',
  cibles: 'c',
  ameliorationContinue: 'ac',
  page: 'p',
  sort: 'sort',
  noPilote: 'ssp',
  noServicePilote: 'sssp',
  noStatut: 'sss',
  noPlan: 'np',
  noPriorite: 'npr',
  typePeriode: 'tp',
  debutPeriode: 'dp',
  finPeriode: 'fp',
  modifiedAfter: 'ma',
  // Not supported for now in filters
  //piliersEci: 'pe',
  //effetsAttendus: 'ea',
  //participationCitoyenneType: 'pc',
  //axes: 'ax',
  sousThematiqueIds: 'st',
  noReferent: 'nr',
};

/** Page de listing de toutes les fiches actions de la collectivité */
const ToutesLesFichesAction = () => {
  const { collectiviteId, isReadOnly } = useCurrentCollectivite();

  const { count } = useFicheActionCount();

  const [filterParams, setFilterParams] = useSearchParams<Filtres>(
    makeCollectiviteToutesLesFichesUrl({
      collectiviteId,
    }),
    {},
    nameToparams
  );

  const filters = convertParamsToFilters(filterParams);

  const { mutate: createFicheAction } = useCreateFicheAction();
  const tracker = useEventTracker();

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
                tracker(Event.updateFiltres, {
                  filtreValues: filters,
                });
              }}
            />
          </ButtonMenu>
        )}
        enableGroupedActions
        isReadOnly={isReadOnly}
        displayEditionMenu
      />
    </div>
  );
};

export default ToutesLesFichesAction;

/** Convertit les paramètres d'URL en filtres */
const convertParamsToFilters = (paramFilters: Filtres) => {
  if (paramFilters.modifiedSince && Array.isArray(paramFilters.modifiedSince)) {
    paramFilters.modifiedSince = paramFilters.modifiedSince[0];
  }
  if (paramFilters.debutPeriode && Array.isArray(paramFilters.debutPeriode)) {
    paramFilters.debutPeriode = paramFilters.debutPeriode[0];
  }
  if (paramFilters.finPeriode && Array.isArray(paramFilters.finPeriode)) {
    paramFilters.finPeriode = paramFilters.finPeriode[0];
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
  if (
    paramFilters.hasMesuresLiees &&
    Array.isArray(paramFilters.hasMesuresLiees)
  ) {
    const hasMesuresLieesAsString = paramFilters.hasMesuresLiees[0];
    paramFilters.hasMesuresLiees =
      hasMesuresLieesAsString === undefined
        ? undefined
        : hasMesuresLieesAsString === 'true';
  }
  return paramFilters;
};
