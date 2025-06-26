'use client';

import Arborescence from './DragAndDropNestedContainers/Arborescence';

import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import {
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsLandingUrl,
} from '@/app/app/paths';
import { AxeActions } from '@/app/plans/plans/detailed-plan-action-view/AxeActions';
import { Actions } from '@/app/plans/plans/detailed-plan-action-view/Header/Actions';
import { PlanActionStatus } from '@/app/plans/plans/detailed-plan-action-view/PlanActionStatus';
import { TPlanType } from '@/app/types/alias';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import { Spacer } from '@/ui/design-system/Spacer';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { ContentPanelWithHeader } from '../components/ContentPanelWithHeader';
import { Header } from '../components/Header';
import { PlanNode } from '../types';
import { checkAxeHasFiche } from '../utils';
import { usePlanAction } from './data/use-fetch-plan-action';
import { FiltresMenuButton } from './Filtres';
import { usePlanActionFilters } from './Filtres/context/PlanActionFiltersContext';
import { FilteredResults } from './Filtres/FilteredResults';

type Props = {
  currentCollectivite: CurrentCollectivite;
  /** Axe racine du plan d'action (depth = 0) */
  rootAxe: PlanNode;
  /** La liste des axes liés à ce plan d'action */
  axes: PlanNode[];
  /** Type du plan d'action */
  planType: TPlanType | null;
};

export const PlanActionView = ({
  rootAxe,
  axes: initialAxes,
  currentCollectivite,
  planType,
}: Props) => {
  const {
    isFiltered,
    filteredResults,
    resetFilters,
    filters,
    onDeleteFilterValue,
    onDeleteFilterCategory,
    getFilterValuesLabels,
  } = usePlanActionFilters();

  const axes = usePlanAction(rootAxe.id, {
    initialData: initialAxes,
  });

  const axe = axes.find((a) => a.id === rootAxe.id);
  if (!axe) {
    return <div>Axe non trouvé</div>;
  }

  const axeHasFiche = checkAxeHasFiche(axe, axes);

  const filtersToDisplay = {
    referents: filters.referents,
    statuts: filters.statuts,
    priorites: filters.priorites,
    pilotes: filters.pilotes,
  };

  return (
    <div className="w-full">
      <Header
        title={axe.nom}
        actionButtons={
          <VisibleWhen condition={currentCollectivite.isReadOnly === false}>
            <Actions
              collectiviteId={currentCollectivite.collectiviteId}
              planId={rootAxe.id}
              type={planType}
              axe={axe}
              axes={axes}
              axeHasFiches={axeHasFiche}
            />
          </VisibleWhen>
        }
        breadcrumbs={[
          {
            label: "Tous les plans d'action",
            href: makeCollectivitePlansActionsLandingUrl({
              collectiviteId: currentCollectivite.collectiviteId,
            }),
          },
          {
            label: axe.nom,
            href: makeCollectivitePlanActionUrl({
              collectiviteId: currentCollectivite.collectiviteId,
              planActionUid: axe.id.toString(),
            }),
          },
        ]}
      />
      <Spacer height={1} />
      <div className="flex flex-col gap-2 grow">
        <span className="text-sm uppercase text-grey-8 font-normal">
          {planType?.type || 'Sans type'}
        </span>
        <PlanActionStatus planId={rootAxe.id} />
      </div>
      <Spacer height={4} />
      <ContentPanelWithHeader
        title="Liste des actions"
        headerActionButtons={
          <>
            <VisibleWhen condition={currentCollectivite.isReadOnly === false}>
              <AxeActions
                plan={rootAxe}
                axe={axe}
                collectiviteId={currentCollectivite.collectiviteId}
              />
            </VisibleWhen>
            <VisibleWhen condition={axeHasFiche}>
              <FiltresMenuButton />
            </VisibleWhen>
          </>
        }
      >
        <VisibleWhen condition={!isFiltered}>
          <Arborescence
            plan={rootAxe}
            axe={axe}
            axes={axes}
            collectivite={currentCollectivite}
          />
        </VisibleWhen>
        <VisibleWhen condition={isFiltered}>
          <FilteredResults
            collectivite={currentCollectivite}
            planId={rootAxe.id.toString()}
            filteredResults={filteredResults}
            resetFilters={resetFilters}
            filters={filtersToDisplay}
            onDeleteFilterValue={onDeleteFilterValue}
            onDeleteFilterCategory={onDeleteFilterCategory}
            getFilterValuesLabels={getFilterValuesLabels}
          />
        </VisibleWhen>
      </ContentPanelWithHeader>
      <Spacer height={12} />
      <ScrollTopButton />
      <Spacer height={12} />
    </div>
  );
};
