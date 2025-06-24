import { useCurrentCollectivite } from '@/api/collectivites';
import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import FichesActionListe from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/FichesActionListe';
import MenuFiltresToutesLesFichesAction from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/MenuFiltresToutesLesFichesAction';
import { useFiltersToParams } from '@/app/app/pages/collectivite/PlansActions/ToutesLesFichesAction/useFiltersToParams';
import { makeCollectiviteToutesLesFichesUrl } from '@/app/app/paths';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { ListFichesRequestFilters as Filtres } from '@/domain/plans/fiches';
import { Button, ButtonMenu, Event, useEventTracker } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useEffect, useState } from 'react';
import { useFicheActionCount } from '../FicheAction/data/useFicheActionCount';

/** Paramètres d'URL possibles pour les filtres de fiches action */
export type FicheActionParam =
  | 's'
  | 'prio'
  | 'ms'
  | 'text'
  | 'bp'
  | 'dfp'
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
  | 'nt'
  | 'nds'
  | 'ands'
  | 'nr'
  | 'swc';

export const nameToparams: Record<
  keyof Filtres | 'sort' | 'page',
  FicheActionParam
> = {
  statuts: 's',
  priorites: 'prio',
  modifiedSince: 'ms',
  texteNomOuDescription: 'text',
  hasBudgetPrevisionnel: 'bp',
  hasDateDeFinPrevisionnelle: 'dfp',
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
  noTag: 'nt',
  noPlan: 'np',
  noPriorite: 'npr',
  typePeriode: 'tp',
  debutPeriode: 'dp',
  finPeriode: 'fp',
  modifiedAfter: 'ma',
  noteDeSuivi: 'nds',
  anneesNoteDeSuivi: 'ands',
  // Not supported for now in filters
  //piliersEci: 'pe',
  //effetsAttendus: 'ea',
  //participationCitoyenneType: 'pc',
  //axes: 'ax',
  sousThematiqueIds: 'st',
  noReferent: 'nr',
  sharedWithCollectivites: 'swc',
};

/** Page de listing de toutes les fiches actions de la collectivité */
const ToutesLesFichesAction = () => {
  const { collectiviteId, isReadOnly } = useCurrentCollectivite();
  const { nameToparams, convertParamsToFilters } = useFiltersToParams();
  const [filters, setFilters] = useState<Filtres>({});

  const { count } = useFicheActionCount();

  const [filterParams, setFilterParams] = useSearchParams<Filtres>(
    makeCollectiviteToutesLesFichesUrl({
      collectiviteId,
    }),
    {},
    nameToparams
  );

  useEffect(() => {
    setFilters(convertParamsToFilters(filterParams));
  }, [filterParams]);

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
              title="Filtrer les actions"
              filters={filters}
              setFilters={(filters: Filtres) => {
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
