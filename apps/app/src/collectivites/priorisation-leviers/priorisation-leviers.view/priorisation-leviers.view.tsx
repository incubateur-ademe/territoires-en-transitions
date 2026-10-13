'use client';

import { makeCollectivitePreselectionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { BetaLabel } from '@/app/ui/beta.label';
import type { MatrixAnchor } from '@/app/ui/charts/matrix/matrix.chart';
import { LoadingStatus } from '@/app/ui/shared/loading-status';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { LevierId, levierIdEnumValues } from '@tet/domain/shared';
import { Alert, Button, PageHeader, VisibleWhen } from '@tet/ui';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@tet/ui/design-system/TabsNext/index';
import { countBy, sumBy } from 'es-toolkit';
import { JSX, Ref, useMemo } from 'react';
import { match } from 'ts-pattern';
import { LevierCardInfo } from '../levier-card-info';
import { LeviersView } from './leviers-view';
import { priorisationTargets } from '../priorisation-tour/priorisation-tour.targets';
import { Preselection, usePreselection } from '../use-preselection';
import { LeviersMatrixChart } from './charts/leviers-matrix.chart';
import { LeviersMondrianChart } from './charts/leviers-mondrian.chart';
import { SousLeviersChart } from './charts/sous-leviers.chart';
import {
  LevierPriorisation,
  PotentielsReduction,
} from './data/to-leviers-priorisation';
import {
  isBlindSpot,
  LevierPlace,
  PreselectedCountByLevier,
  toLeviersWithoutPotentiel,
} from './data/to-matrix-points';
import {
  LeviersPriorisationQuery,
  useLeviersPriorisation,
} from './data/use-leviers-priorisation';
import { useLeviersPlaces } from './data/use-leviers-places';
import { useUpsertPertinence } from './data/use-upsert-pertinence';
import {
  LevierSidePanel,
  useLevierSidePanel,
} from './levier-panel/use-levier-side-panel';
import { LeviersWithoutPotentielList } from './leviers-without-potentiel.list';
import { PriorisationMetrics } from './priorisation.metrics';
import { SelectLevier } from './select-levier';
import { useLeviersViewWithTour } from './use-leviers-view-with-tour';

type PriorisationAlertsProps = {
  hasMobilisation: boolean;
  potentiels: PotentielsReduction;
};

type LeviersViewState = {
  view: LeviersView;
  onViewChange: (view: LeviersView) => void;
};

type LeviersTabsSectionProps = LeviersSectionProps &
  LeviersViewState & { ref?: Ref<HTMLDivElement> };

type LeviersSectionProps = {
  leviers: LevierPriorisation[];
  places: LevierPlace[];
  preselectedCountByLevier: PreselectedCountByLevier;
  selectedLevierId?: LevierId;
  onLevierSelected: SelectLevier;
  anchor?: MatrixAnchor;
};

type BreakdownViewProps = Pick<
  LeviersSectionProps,
  'places' | 'selectedLevierId' | 'onLevierSelected'
>;

type SousLeviersViewProps = Pick<
  LeviersSectionProps,
  'places' | 'onLevierSelected'
>;

type PriorisationBoardProps = {
  leviers: LevierPriorisation[];
  places: LevierPlace[];
  levierToPrioritizeId?: LevierId;
  hasMobilisation: boolean;
  potentiels: PotentielsReduction;
  preselection: Preselection;
  levierSidePanel: LevierSidePanel;
  leviersView: LeviersViewState;
};

type PriorisationContentProps = Omit<
  PriorisationBoardProps,
  'leviers' | 'hasMobilisation' | 'potentiels'
> & {
  leviersQuery: LeviersPriorisationQuery;
};

const toPreselectedCountByLevier = (
  preselection: Preselection
): PreselectedCountByLevier => {
  const countByLevier = countBy(preselection.actions, ({ levier }) => levier);
  return new Map(
    levierIdEnumValues.map((levierId) => [
      levierId,
      countByLevier[levierId] ?? 0,
    ])
  );
};

const PriorisationAlerts = ({
  hasMobilisation,
  potentiels,
}: PriorisationAlertsProps): JSX.Element => {
  const isPotentielUnavailable = potentiels.status === 'indisponible';
  return (
    <div className="flex flex-col gap-4">
      <VisibleWhen condition={!hasMobilisation}>
        <Alert title={appLabels.mobilisationAbsente} />
      </VisibleWhen>
      <VisibleWhen condition={isPotentielUnavailable}>
        <Alert state="warning" title={appLabels.potentielsIndisponibles} />
      </VisibleWhen>
    </div>
  );
};

const MatrixView = ({
  leviers,
  places,
  preselectedCountByLevier,
  selectedLevierId,
  onLevierSelected,
  anchor,
}: LeviersSectionProps): JSX.Element => {
  const leviersWithoutPotentiel = toLeviersWithoutPotentiel(leviers);
  const hasLeviersWithoutPotentiel = leviersWithoutPotentiel.length > 0;
  return (
    <>
      <LevierCardInfo>{appLabels.selectionnerUnLevier}</LevierCardInfo>
      <LeviersMatrixChart
        places={places}
        preselectedCountByLevier={preselectedCountByLevier}
        selectedLevierId={selectedLevierId}
        onLevierSelected={onLevierSelected}
        anchor={anchor}
      />
      <VisibleWhen condition={hasLeviersWithoutPotentiel}>
        <LeviersWithoutPotentielList
          leviers={leviersWithoutPotentiel}
          onLevierSelected={onLevierSelected}
        />
      </VisibleWhen>
    </>
  );
};

const BreakdownView = ({
  places,
  selectedLevierId,
  onLevierSelected,
}: BreakdownViewProps): JSX.Element => (
  <>
    <LevierCardInfo>{appLabels.repartitionPotentielInfo}</LevierCardInfo>
    <LeviersMondrianChart
      places={places}
      selectedLevierId={selectedLevierId}
      onLevierSelected={onLevierSelected}
    />
  </>
);

const SousLeviersView = ({
  places,
  onLevierSelected,
}: SousLeviersViewProps): JSX.Element => (
  <>
    <LevierCardInfo>{appLabels.sousLeviersInfo}</LevierCardInfo>
    <SousLeviersChart places={places} onLevierSelected={onLevierSelected} />
  </>
);

const LeviersSection = ({
  ref,
  view,
  onViewChange,
  ...props
}: LeviersTabsSectionProps): JSX.Element => (
  <Tabs className="flex flex-col gap-4">
    <TabsList className="justify-start">
      <TabsTab
        label={appLabels.leviersAPrioriser}
        isActive={view === 'matrix'}
        onClick={() => onViewChange('matrix')}
      />
      <TabsTab
        label={appLabels.vueEnsembleLeviers}
        isActive={view === 'breakdown'}
        onClick={() => onViewChange('breakdown')}
      />
      <TabsTab
        label={appLabels.sousLeviersAPrioriser}
        isActive={view === 'sousLeviers'}
        onClick={() => onViewChange('sousLeviers')}
      />
    </TabsList>
    <TabsPanel
      ref={ref}
      className="gap-4 rounded-xl border border-grey-3 bg-white p-6"
    >
      {match(view)
        .with('matrix', () => <MatrixView {...props} />)
        .with('sousLeviers', () => <SousLeviersView {...props} />)
        .with('breakdown', () => <BreakdownView {...props} />)
        .exhaustive()}
    </TabsPanel>
  </Tabs>
);

const toAnchor = ({
  levierToPrioritizeId,
  elementRef,
}: {
  levierToPrioritizeId?: LevierId;
  elementRef: MatrixAnchor['elementRef'];
}): MatrixAnchor | undefined => {
  if (levierToPrioritizeId === undefined) {
    return undefined;
  }
  return { pointId: levierToPrioritizeId, elementRef };
};

const PriorisationBoard = ({
  leviers,
  places,
  levierToPrioritizeId,
  hasMobilisation,
  potentiels,
  preselection,
  levierSidePanel,
  leviersView,
}: PriorisationBoardProps): JSX.Element => {
  const preselectedCountByLevier = useMemo(
    () => toPreselectedCountByLevier(preselection),
    [preselection]
  );

  const leviersPanelRef = priorisationTargets.useTarget('leviersPanel');
  const levierToPrioritizeRef =
    priorisationTargets.useTarget('levierToPrioritize');

  return (
    <div className="flex flex-col gap-8">
      <PriorisationMetrics
        preselectedActionsCount={preselection.actions.length}
        blindSpotCount={places.filter(isBlindSpot).length}
        analyzedActionsCount={sumBy(leviers, ({ ficheCount }) => ficheCount)}
      />
      <PriorisationAlerts
        hasMobilisation={hasMobilisation}
        potentiels={potentiels}
      />
      <LeviersSection
        ref={leviersPanelRef}
        leviers={leviers}
        places={places}
        preselectedCountByLevier={preselectedCountByLevier}
        selectedLevierId={levierSidePanel.selectedLevierId}
        onLevierSelected={levierSidePanel.select}
        anchor={toAnchor({
          levierToPrioritizeId: levierToPrioritizeId,
          elementRef: levierToPrioritizeRef,
        })}
        {...leviersView}
      />
    </div>
  );
};

const PriorisationContent = ({
  leviersQuery,
  ...boardProps
}: PriorisationContentProps): JSX.Element =>
  match(leviersQuery)
    .with({ status: 'loading' }, () => <LoadingStatus />)
    .with({ status: 'error' }, ({ retry }) => (
      <ErrorCard title={appLabels.uneErreurEstSurvenue} retry={retry} />
    ))
    .with({ status: 'ready' }, ({ leviers, hasMobilisation, potentiels }) => (
      <PriorisationBoard
        {...boardProps}
        leviers={leviers}
        hasMobilisation={hasMobilisation}
        potentiels={potentiels}
      />
    ))
    .exhaustive();

export const PriorisationLeviersView = (): JSX.Element => {
  const { collectiviteId } = useCurrentCollectivite();
  const leviersQuery = useLeviersPriorisation(collectiviteId);
  const upsertPertinence = useUpsertPertinence();
  const preselection = usePreselection();
  const { leviers, places, levierToPrioritizeId } =
    useLeviersPlaces(leviersQuery);
  const levierSidePanel = useLevierSidePanel({
    leviers,
    preselection,
    upsertPertinence,
    headerRef: priorisationTargets.useTarget('levierHeader'),
    actionsRef: priorisationTargets.useTarget('firstActionDeReference'),
  });
  const isTourReady = leviersQuery.status === 'ready' && preselection.isReady;
  const { Tour, view, setView, restartOnMatrix } = useLeviersViewWithTour({
    isTourReady,
    levierToPrioritizeId,
    levierSidePanel,
  });
  const tourHelpRef = priorisationTargets.useTarget('tourHelp');

  return (
    <>
      {Tour}
      <PageHeader>
        <PageHeader.Title>
          <BetaLabel>{appLabels.priorisationLeviersTitre}</BetaLabel>
        </PageHeader.Title>
        <PageHeader.Actions>
          <div className="flex flex-wrap gap-4">
            <VisibleWhen condition={isTourReady}>
              <Button
                ref={tourHelpRef}
                variant="outlined"
                size="xs"
                onClick={restartOnMatrix}
              >
                {appLabels.priorisationVisiteRelancer}
              </Button>
            </VisibleWhen>
            <Button
              size="xs"
              href={makeCollectivitePreselectionUrl({ collectiviteId })}
            >
              {preselection.isReady
                ? appLabels.actionsPreselectionneesCompte(
                    preselection.actions.length
                  )
                : appLabels.actionsPreselectionneesTitre}
            </Button>
          </div>
        </PageHeader.Actions>
      </PageHeader>
      <PriorisationContent
        leviersQuery={leviersQuery}
        places={places}
        levierToPrioritizeId={levierToPrioritizeId}
        preselection={preselection}
        levierSidePanel={levierSidePanel}
        leviersView={{ view, onViewChange: setView }}
      />
    </>
  );
};
