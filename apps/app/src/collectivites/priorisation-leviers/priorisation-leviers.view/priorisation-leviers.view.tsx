'use client';

import { appLabels } from '@/app/labels/catalog';
import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { BetaLabel } from '@/app/ui/beta.label';
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
  toLevierToPrioritizeId,
  toLeviersPlaces,
  toLeviersWithoutPotentiel,
} from './data/to-matrix-points';
import {
  LeviersPriorisationQuery,
  useLeviersPriorisation,
} from './data/use-leviers-priorisation';
import {
  UpsertPertinence,
  useUpsertPertinence,
} from './data/use-upsert-pertinence';
import { useLevierSidePanel } from './levier-panel/use-levier-side-panel';
import { LeviersWithoutPotentielList } from './leviers-without-potentiel.list';
import {
  PriorisationAnalyse,
  PriorisationSummary,
} from './priorisation.summary';
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
  collectiviteId: number;
  leviers: LevierPriorisation[];
  hasMobilisation: boolean;
  potentiels: PotentielsReduction;
  preselection: Preselection;
  upsertPertinence?: UpsertPertinence;
  leviersView: LeviersViewState;
};

type PriorisationContentProps = {
  collectiviteId: number;
  leviersQuery: LeviersPriorisationQuery;
  preselection: Preselection;
  upsertPertinence?: UpsertPertinence;
  leviersView: LeviersViewState;
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
        label={appLabels.matriceDePriorisation}
        isActive={view === 'matrix'}
        onClick={() => onViewChange('matrix')}
      />
      <TabsTab
        label={appLabels.carteDesLeviers}
        isActive={view === 'breakdown'}
        onClick={() => onViewChange('breakdown')}
      />
      <TabsTab
        label={appLabels.classementSousLeviers}
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

const PriorisationBoard = ({
  collectiviteId,
  leviers,
  hasMobilisation,
  potentiels,
  preselection,
  upsertPertinence,
  leviersView,
}: PriorisationBoardProps): JSX.Element => {
  const places = useMemo(() => toLeviersPlaces(leviers), [leviers]);
  const preselectedCountByLevier = useMemo(
    () => toPreselectedCountByLevier(preselection),
    [preselection]
  );
  const levierSidePanel = useLevierSidePanel({
    leviers,
    places,
    preselection,
    upsertPertinence,
  });

  const metricsRef = priorisationTargets.useTarget('metrics');
  const leviersPanelRef = priorisationTargets.useTarget('leviersPanel');

  return (
    <div className="flex flex-col gap-8">
      <div ref={metricsRef}>
        <PriorisationSummary
          collectiviteId={collectiviteId}
          blindSpotCount={places.filter(isBlindSpot).length}
          levierToPrioritizeId={toLevierToPrioritizeId(places)}
          preselectedActionsCount={preselection.actions.length}
          onLevierSelected={levierSidePanel.select}
        />
      </div>
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
        {...leviersView}
      />
    </div>
  );
};

const PriorisationContent = ({
  collectiviteId,
  leviersQuery,
  preselection,
  upsertPertinence,
  leviersView,
}: PriorisationContentProps): JSX.Element =>
  match(leviersQuery)
    .with({ status: 'loading' }, () => <LoadingStatus />)
    .with({ status: 'error' }, ({ retry }) => (
      <ErrorCard title={appLabels.uneErreurEstSurvenue} retry={retry} />
    ))
    .with({ status: 'ready' }, ({ leviers, hasMobilisation, potentiels }) => (
      <PriorisationBoard
        collectiviteId={collectiviteId}
        leviers={leviers}
        hasMobilisation={hasMobilisation}
        potentiels={potentiels}
        preselection={preselection}
        upsertPertinence={upsertPertinence}
        leviersView={leviersView}
      />
    ))
    .exhaustive();

export const PriorisationLeviersView = (): JSX.Element => {
  const { collectiviteId } = useCurrentCollectivite();
  const leviersQuery = useLeviersPriorisation(collectiviteId);
  const upsertPertinence = useUpsertPertinence();
  const preselection = usePreselection();
  const plansQuery = useListPlans(collectiviteId, { limit: 1 });
  const isLeviersReady = leviersQuery.status === 'ready';
  const isTourReady = isLeviersReady && preselection.isReady;
  const { Tour, view, setView, restartOnMatrix } = useLeviersViewWithTour({
    isTourReady,
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
                onClick={restartOnMatrix}
              >
                {appLabels.priorisationVisiteRelancer}
              </Button>
            </VisibleWhen>
          </div>
        </PageHeader.Actions>
        {isLeviersReady && !plansQuery.isLoading && (
          <PageHeader.Subtitle>
            <PriorisationAnalyse
              actionsCount={sumBy(
                leviersQuery.leviers,
                ({ ficheCount }) => ficheCount
              )}
              plansCount={plansQuery.totalCount}
            />
          </PageHeader.Subtitle>
        )}
      </PageHeader>
      <PriorisationContent
        collectiviteId={collectiviteId}
        leviersQuery={leviersQuery}
        preselection={preselection}
        upsertPertinence={upsertPertinence}
        leviersView={{ view, onViewChange: setView }}
      />
    </>
  );
};
