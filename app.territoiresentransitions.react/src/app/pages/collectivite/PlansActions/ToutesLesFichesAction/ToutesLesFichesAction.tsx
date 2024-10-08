import { Filtre } from '@tet/api/plan-actions/fiche-resumes.list/domain/fetch-options.schema';
import { useCreateFicheAction } from '@tet/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import { Button, ButtonMenu } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import FichesActionListe from 'app/pages/collectivite/PlansActions/ToutesLesFichesAction/FichesActionListe';
import MenuFiltresToutesLesFichesAction from 'app/pages/collectivite/PlansActions/ToutesLesFichesAction/MenuFiltresToutesLesFichesAction';
import { makeCollectiviteToutesLesFichesUrl } from 'app/paths';
import { useSearchParams } from 'core-logic/hooks/query';
import { useCurrentCollectivite } from 'core-logic/hooks/useCurrentCollectivite';

/** Paramètres d'URL possibles pour les filtres de fiches action */
export type FicheActionParam =
  | 's'
  | 'prio'
  | 'ms'
  | 'text'
  | 'bp'
  | 'r'
  | 'il'
  | 'pa'
  | 'ra'
  | 'up'
  | 'pp'
  | 'ur'
  | 'pt'
  | 'pr'
  | 'sp'
  | 'sv'
  | 't'
  | 'f'
  | 'c'
  | 'dd'
  | 'df'
  | 'ac'
  | 'p'
  | 'lfa'
  | 'sort';

// TODO: implémenter les filtres "sans" (ex. "sans_pilote")
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
  referentielActionIds: 'ra',
  linkedFicheActionIds: 'lfa',
  utilisateurPiloteIds: 'up',
  personnePiloteIds: 'pp',
  utilisateurReferentIds: 'ur',
  partenaireIds: 'pt',
  personneReferenteIds: 'pr',
  structurePiloteIds: 'sp',
  servicePiloteIds: 'sv',
  thematiqueIds: 't',
  financeurIds: 'f',
  cibles: 'c',
  dateDebut: 'dd',
  dateFin: 'df',
  ameliorationContinue: 'ac',
  page: 'p',
  sort: 'sort',
};

/** Page de listing de toutes les fiches actions de la collectivité */
const ToutesLesFichesAction = () => {
  const collectivite = useCurrentCollectivite();

  const isReadonly = collectivite?.readonly ?? false;

  const { mutate: createFicheAction } = useCreateFicheAction();

  const [filterParams, setFilterParams] = useSearchParams<Filtre>(
    makeCollectiviteToutesLesFichesUrl({
      collectiviteId: collectivite?.collectivite_id!,
    }),
    {},
    nameToparams
  );

  const filters = convertParamsToFilters(filterParams);

  return (
    <div className="min-h-[44rem] flex flex-col gap-8">
      <div className="flex items-end">
        <h2 className="mb-0 mr-auto">Toutes les actions</h2>
        {!isReadonly && (
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
          >
            <MenuFiltresToutesLesFichesAction
              filters={filters}
              setFilters={(filters) => setFilterParams(filters)}
            />
          </ButtonMenu>
        )}
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
  return paramFilters;
};
