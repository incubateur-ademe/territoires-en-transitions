import { useEffect, useState } from 'react';

import { Button, ButtonGroup, Pagination, Select } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import ModuleFiltreBadges from 'app/pages/collectivite/TableauDeBord/components/ModuleFiltreBadges';
import {
  FetchFilter,
  FetchSort,
  SortPlansActionValue,
} from '@tet/api/plan-actions/plan-actions.list/domain/fetch-options.schema';
import { usePlansActionsListe } from '@tet/app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import PictoDocument from 'ui/pictogrammes/PictoDocument';
import PlanActionCard from '@tet/app/pages/collectivite/PlansActions/PlanAction/list/card/PlanActionCard';
import { ModuleDisplay } from '@tet/app/pages/collectivite/TableauDeBord/components/Module';
import { makeCollectivitePlanActionUrl } from '@tet/app/paths';

type sortByOptionsType = {
  label: string;
  value: SortPlansActionValue;
  direction: 'asc' | 'desc';
};

type SortSettings<T> = {
  /** Tri par défaut */
  defaultSort: T;
  /** Options à afficher dans le sélecteur de tri */
  sortOptionsDisplayed?: T[];
};

type SortIndicateurSettings = SortSettings<SortPlansActionValue>;

const sortByOptions: sortByOptionsType[] = [
  {
    label: 'Ordre alphabétique',
    value: 'nom',
    direction: 'asc',
  },
  {
    label: 'Date de création',
    value: 'created_at',
    direction: 'desc',
  },
];

type Props = {
  filtres: FetchFilter;
  settings?: (openState: OpenState) => React.ReactNode;
  resetFilters?: () => void;
  /** Nombre de plans à afficher sur une page */
  maxNbOfCards?: number;
  sortSettings?: SortIndicateurSettings;
  displaySettings?: {
    display: ModuleDisplay;
    setDisplay: (display: ModuleDisplay) => void;
  };
};

/** Liste de fiches action avec tri et options de fitlre */
const PlansActionListe = ({
  filtres,
  resetFilters,
  settings,
  maxNbOfCards = 9,
  sortSettings = {
    defaultSort: 'nom',
  },
  displaySettings,
}: Props) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  /** Tri sélectionné */
  const [sort, setSort] = useState<SortPlansActionValue>(
    sortSettings.defaultSort
  );

  /** Page courante */
  const [currentPage, setCurrentPage] = useState(1);

  /** Récupère les plans d'action */
  const { data, isLoading } = usePlansActionsListe({
    withSelect: ['axes'],
    options: {
      filtre: {},
      page: currentPage,
      limit: maxNbOfCards,
      sort: [
        {
          field: sort,
          direction:
            sortByOptions.find((o) => o.value === sort)?.direction || 'asc',
        },
      ],
    },
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [isLoading]);

  return (
    <>
      <div className="flex items-center gap-8 py-6 border-y border-primary-3">
        {/** Tri */}
        <div className="w-64">
          <Select
            options={sortByOptions}
            onChange={(value) => setSort(value as SortPlansActionValue)}
            values={sort}
            customItem={(v) => <span className="text-grey-8">{v.label}</span>}
            small
          />
        </div>
        {/** Nombre total de résultats */}
        <span className="shrink-0 text-grey-7 mr-auto">
          {isLoading ? '--' : data?.count}
          {` `}
          {`plan`}
          {data && data?.count > 1 ? 's' : ''}
        </span>
        <ButtonGroup
          activeButtonId={displaySettings?.display}
          className="max-w-fit"
          size="sm"
          buttons={[
            {
              children: 'Diagramme',
              icon: 'pie-chart-2-line',
              onClick: () => displaySettings?.setDisplay('circular'),
              id: 'circular',
            },
            {
              children: 'Progression',
              icon: 'layout-grid-line',
              onClick: () => displaySettings?.setDisplay('row'),
              id: 'row',
            },
          ]}
        />
        {/** Bouton d'édition des filtres (une modale avec bouton ou un ButtonMenu) */}
        {settings?.({ isOpen: isSettingsOpen, setIsOpen: setIsSettingsOpen })}
      </div>
      {/** Liste des filtres appliqués */}
      <ModuleFiltreBadges filtre={filtres} resetFilters={resetFilters} />

      {/** Chargement */}
      {isLoading ? (
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      ) : /** État vide  */
      data?.plans.length === 0 ? (
        <div className="flex flex-col items-center gap-2 m-auto">
          <PictoDocument className="w-32 h-32" />
          <p className="text-primary-8">
            Aucun plan d'action ne correspond à votre recherche
          </p>

          <Button
            size="sm"
            onClick={() => {
              setIsSettingsOpen(true);
            }}
          >
            Modifier le filtre
          </Button>
        </div>
      ) : (
        /** Liste des fiches actions */
        // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
        <div>
          <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {data?.plans.map((plan) => (
              <PlanActionCard
                key={plan.id}
                plan={plan}
                display={displaySettings?.display}
                link={makeCollectivitePlanActionUrl({
                  collectiviteId: plan.collectiviteId,
                  planActionUid: plan.id.toString(),
                })}
                openInNewTab
              />
            ))}
          </div>
          <div className="flex mt-16">
            <Pagination
              className="mx-auto"
              selectedPage={currentPage}
              nbOfElements={data?.count ?? 0}
              maxElementsPerPage={maxNbOfCards}
              onChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default PlansActionListe;
