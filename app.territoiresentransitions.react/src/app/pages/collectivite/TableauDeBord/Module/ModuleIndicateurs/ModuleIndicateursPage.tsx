import { useState } from 'react';

import {
  Button,
  Checkbox,
  Input,
  Pagination,
  Select,
  TrackPageView,
  useEventTracker,
} from '@tet/ui';

import {
  ModuleIndicateursSelect,
  Slug,
} from '@tet/api/collectivites/tableau_de_bord.show/domain/module.schema';
import { Indicateurs } from '@tet/api';
import IndicateurCard from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import { getIndicateurGroup } from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { useFilteredIndicateurDefinitions } from 'app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import ModuleFiltreBadges from 'app/pages/collectivite/TableauDeBord/Module/ModuleFiltreBadges';
import ModalIndicateursSuiviPlan from 'app/pages/collectivite/TableauDeBord/Module/ModuleIndicateurs/ModalIndicateursSuiviPlan';
import {
  getQueryKey,
  useModuleFetch,
} from 'app/pages/collectivite/TableauDeBord/Module/useModuleFetch';
import { TDBViewParam, makeCollectiviteIndicateursUrl } from 'app/paths';
import { useCollectiviteId } from 'core-logic/hooks/params';
import PictoIndicateurVide from 'ui/pictogrammes/PictoIndicateurVide';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import ModulePage from '../ModulePage';

type orderByOptionsType = {
  label: string;
  value: keyof Indicateurs.Filters;
  direction: 'asc' | 'desc';
};

const orderByOptions: orderByOptionsType[] = [
  {
    label: 'Complétude',
    value: 'rempli',
    direction: 'desc',
  },
  {
    label: 'Ordre alphabétique',
    value: 'text',
    direction: 'asc',
  },
];

type Props = {
  view: TDBViewParam;
  slug: Slug;
};

const ModuleIndicateursPage = ({ view, slug }: Props) => {
  const collectiviteId = useCollectiviteId();

  const { data: module, isLoading: isModuleLoading } = useModuleFetch(slug);

  const [order, setOrder] = useState(orderByOptions[0]);

  /** Texte de recherche pour l'input */
  const [search, setSearch] = useState<string>();
  /** Texte de recherche avec debounced pour l'appel */
  const [debouncedSearch, setDebouncedSearch] = useState<string>();

  const filtre = module && Indicateurs.moduleOptionsToFilters(module.options);

  const { data, isLoading } = useFilteredIndicateurDefinitions(
    null,
    {
      ...filtre,
      text: debouncedSearch,
      sort:
        order.value === 'rempli'
          ? {
              field: order.value,
              direction: order.direction,
            }
          : undefined,
    },
    false
  );

  /** Nombre total d'indicateurs filtrés */
  const total = data?.length;

  /** Nombre d'indicateurs par page */
  const perPage = 9;

  /** Page courante */
  const [currentPage, setCurrentPage] = useState(1);

  /** Liste filtrée des indicateurs à afficher */
  const currentDefs = data?.filter(
    (_, i) => Math.floor(i / perPage) + 1 === currentPage
  );

  /** Affiche ou cache les graphiques des cartes */
  const [displayGraphs, setDisplayGraphs] = useState(true);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const trackEvent = useEventTracker(
    `app/tdb/personnel/indicateurs-de-suivi-de-mes-plans`
  );

  if (isModuleLoading || !module) {
    return null;
  }

  return (
    <ModulePage view={view} title={module.titre}>
      <TrackPageView
        pageName={`app/tdb/personnel/${slug}`}
        properties={{ collectivite_id: collectiviteId! }}
      />
      {/** Paramètres de la liste */}
      <div className="flex items-center gap-8 py-6 border-y border-primary-3">
        {/** Tri */}
        <div className="w-56">
          <Select
            options={orderByOptions}
            onChange={(value) =>
              value && setOrder(orderByOptions.find((o) => o.value === value)!)
            }
            values={order.value}
            customItem={(v) => <span className="text-grey-8">{v.label}</span>}
            small
          />
        </div>
        {/** Toggle affichage des graph */}
        <Checkbox
          variant="switch"
          label="Afficher les graphiques"
          containerClassname="shrink-0"
          labelClassname="font-normal !text-grey-7"
          checked={displayGraphs}
          onChange={() => setDisplayGraphs(!displayGraphs)}
        />
        {/** Nombre total de résultats */}
        <span className="shrink-0 text-grey-7">
          {isLoading ? '--' : total ? total : '0'}
          {` `}
          {`indicateur`}
          {total && total > 1 ? 's' : ''}
        </span>
        {/** Champ de recherche */}
        <Input
          type="search"
          onChange={(e) => setSearch(e.target.value)}
          onSearch={(v) => setDebouncedSearch(v)}
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
            trackEvent('tdb_modifier_filtres_indicateurs', {
              collectivite_id: collectiviteId!,
            });
            setIsSettingsOpen(true);
          }}
        />
        {isSettingsOpen && (
          <ModalIndicateursSuiviPlan
            openState={{ isOpen: isSettingsOpen, setIsOpen: setIsSettingsOpen }}
            module={module as ModuleIndicateursSelect}
            keysToInvalidate={[getQueryKey(slug)]}
          />
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
      currentDefs?.length === 0 ? (
        <div className="flex flex-col items-center gap-2 m-auto">
          <PictoIndicateurVide className="w-32 h-32" />
          <p className="text-primary-8">
            Aucun indicateur ne correspond à votre recherche
          </p>
        </div>
      ) : (
        /** Liste d'indicateurs */
        <>
          <div className="grid grid-cols-2 2xl:grid-cols-3 gap-4">
            {currentDefs?.map((definition) => (
              <IndicateurCard
                key={definition.id}
                definition={definition}
                href={makeCollectiviteIndicateursUrl({
                  collectiviteId: collectiviteId!,
                  indicateurView: getIndicateurGroup(definition.identifiant),
                  indicateurId: definition.id,
                  identifiantReferentiel: definition.identifiant,
                })}
                className="hover:!bg-white"
                card={{ external: true }}
                hideChart={!displayGraphs}
                autoRefresh
              />
            ))}
          </div>
          <div className="mx-auto mt-16">
            <Pagination
              selectedPage={currentPage}
              nbOfElements={total ?? 0}
              maxElementsPerPage={perPage}
              onChange={(page) => setCurrentPage(page)}
            />
          </div>
        </>
      )}
    </ModulePage>
  );
};

export default ModuleIndicateursPage;
