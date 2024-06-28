import {useState} from 'react';

import {TDBViewParam, makeCollectivitePlanActionFicheUrl} from 'app/paths';

import {
  ModuleFicheActionsSelect,
  Slug,
} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import {Filtre as FiltreFicheActions} from '@tet/api/dist/src/fiche_actions/fiche_resumes.list/domain/fetch_options.schema';
import {
  Button,
  Input,
  Pagination,
  Select,
  TrackPageView,
  useEventTracker,
} from '@tet/ui';
import FicheActionCard from 'app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import {useFicheResumesFetch} from 'app/pages/collectivite/PlansActions/FicheAction/data/useFicheResumesFetch';
import ModalActionsDontJeSuisLePilote from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModalActionsDontJeSuisLePilote';
import ModalActionsRecemmentModifiees from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModalActionsRecemmentModifiees';
import ModuleFiltreBadges from 'app/pages/collectivite/TableauDeBord/Module/ModuleFiltreBadges';
import {
  getQueryKey,
  useModuleFetch,
} from 'app/pages/collectivite/TableauDeBord/Module/useModuleFetch';
import {useCollectiviteId} from 'core-logic/hooks/params';
import PictoExpert from 'ui/pictogrammes/PictoExpert';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import ModulePage from '../ModulePage';

type orderByOptionsType = {
  label: string;
  value: keyof FiltreFicheActions;
  direction: 'asc' | 'desc';
};

const orderByOptions: orderByOptionsType[] = [
  {
    label: 'Date de modification',
    value: 'modifiedSince',
    direction: 'desc',
  },
];

const maxNbOfCards = 16;

type Props = {
  view: TDBViewParam;
  slug: Slug;
};

/** Page d'un module du tableau de bord plans d'action */
const ModuleFichesActionsPage = ({view, slug}: Props) => {
  const collectiviteId = useCollectiviteId();

  const {data: dataModule, isLoading: isModuleLoading} = useModuleFetch(slug);
  const module = dataModule as ModuleFicheActionsSelect;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [order, setOrder] = useState(orderByOptions[0]);

  /** Page courante */
  const [currentPage, setCurrentPage] = useState(1);

  /** Texte de recherche pour l'input */
  const [search, setSearch] = useState<string>();

  /** Texte de recherche avec debounced pour l'appel */
  const [debouncedSearch, setDebouncedSearch] = useState<string>();

  const ficheResumesOptions = {
    ...module?.options,
    filtre: {
      ...module?.options.filtre,
      texteNomOuDescription: debouncedSearch,
    },
    page: currentPage,
    limit: maxNbOfCards,
  };

  const {data, isLoading} = useFicheResumesFetch({
    options: ficheResumesOptions,
  });

  const countTotal = data?.count || 0;

  const trackEvent = useEventTracker(`app/tdb/personnel/${slug}`);

  if (isModuleLoading || !module) {
    return null;
  }

  return (
    <ModulePage view={view} title={module.titre}>
      <TrackPageView
        pageName={`app/tdb/personnel/${slug}`}
        properties={{collectivite_id: collectiviteId!}}
      />
      <div className="flex items-center gap-8 py-6 border-y border-primary-3">
        {/** Tri */}
        <div className="w-64">
          <Select
            options={orderByOptions}
            onChange={value =>
              value && setOrder(orderByOptions.find(o => o.value === value)!)
            }
            values={order.value}
            customItem={v => <span className="text-grey-8">{v.label}</span>}
            small
          />
        </div>
        {/** Nombre total de résultats */}
        <span className="shrink-0 text-grey-7">
          {isLoading ? '--' : countTotal}
          {` `}
          {`action`}
          {countTotal > 1 ? 's' : ''}
        </span>
        {/** Champ de recherche */}
        <Input
          type="search"
          onChange={e => setSearch(e.target.value)}
          onSearch={v => setDebouncedSearch(v)}
          value={search}
          containerClassname="ml-auto w-full md:w-96"
          placeholder="Rechercher par nom ou description"
          displaySize="sm"
        />
        {/** Bouton d'édition des filtres du module + modale */}
        <Button
          variant="outlined"
          icon="equalizer-line"
          size="sm"
          onClick={() => {
            trackEvent(
              (slug === 'actions-dont-je-suis-pilote'
                ? 'tdb_modifier_filtres_actions_pilotes'
                : 'tdb_modifier_filtres_actions_modifiees') as never,
              {collectivite_id: collectiviteId} as never
            );
            setIsSettingsOpen(true);
          }}
        />
        {isSettingsOpen && (
          <>
            {module.slug === 'actions-dont-je-suis-pilote' && (
              <ModalActionsDontJeSuisLePilote
                openState={{
                  isOpen: isSettingsOpen,
                  setIsOpen: setIsSettingsOpen,
                }}
                module={module as ModuleFicheActionsSelect}
                keysToInvalidate={[getQueryKey(slug)]}
              />
            )}
            {module.slug === 'actions-recemment-modifiees' && (
              <ModalActionsRecemmentModifiees
                openState={{
                  isOpen: isSettingsOpen,
                  setIsOpen: setIsSettingsOpen,
                }}
                module={module as ModuleFicheActionsSelect}
                keysToInvalidate={[getQueryKey(slug)]}
              />
            )}
          </>
        )}
      </div>
      {/** Liste des filtres appliqués */}
      <ModuleFiltreBadges filtre={module.options.filtre} />

      {/** Chargement */}
      {isLoading ? (
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      ) : /** État vide  */
      data?.data?.length === 0 ? (
        <div className="flex flex-col items-center gap-2 m-auto">
          <PictoExpert className="w-32 h-32" />
          <p className="text-primary-8">
            Aucune fiche action ne correspond à votre recherche
          </p>
        </div>
      ) : (
        /** Liste des fiches actions */
        // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
        <div>
          <div className="grid grid-cols-2 2xl:grid-cols-3 gap-4">
            {data?.data?.map(fiche => (
              <FicheActionCard
                key={fiche.id}
                ficheAction={fiche}
                isEditable
                editKeysToInvalidate={[
                  [
                    'fiches_resume_collectivite',
                    collectiviteId,
                    ficheResumesOptions,
                  ],
                ]}
                link={makeCollectivitePlanActionFicheUrl({
                  collectiviteId: collectiviteId!,
                  ficheUid: fiche.id.toString(),
                  planActionUid: fiche.plan_id?.toString()!,
                })}
              />
            ))}
          </div>
          <div className="mx-auto mt-16">
            <Pagination
              selectedPage={currentPage}
              nbOfElements={countTotal}
              maxElementsPerPage={maxNbOfCards}
              onChange={page => setCurrentPage(page)}
            />
          </div>
        </div>
      )}
    </ModulePage>
  );
};

export default ModuleFichesActionsPage;
