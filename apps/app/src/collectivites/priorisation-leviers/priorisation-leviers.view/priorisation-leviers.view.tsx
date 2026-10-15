'use client';

import { appLabels } from '@/app/labels/catalog';
import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { BetaLabel } from '@/app/ui/beta.label';
import type { MatrixAnchor } from '@/app/ui/charts/matrix/matrix.chart';
import { LoadingStatus } from '@/app/ui/shared/loading-status';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  CategorieAction,
  LevierId,
  levierIdEnumValues,
} from '@tet/domain/shared';
import { Alert, Button, PageHeader, VisibleWhen } from '@tet/ui';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@tet/ui/design-system/TabsNext/index';
import { countBy, sumBy } from 'es-toolkit';
import { JSX, ReactNode, Ref, useMemo } from 'react';
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
import {
  PriorisationAnalyse,
  PriorisationSummary,
} from './priorisation.summary';
import { PriorisationEmptyCard } from './priorisation-empty.card';
import { SelectLevier } from './select-levier';
import { useLeviersViewWithTour } from './use-leviers-view-with-tour';

type PriorisationAlertsProps = {
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
  preselectedActions: Preselection['actions'];
  selectedLevierId?: LevierId;
  selectedCategorie?: CategorieAction;
  onLevierSelected: SelectLevier;
  anchor?: MatrixAnchor;
};

type BreakdownViewProps = Pick<
  LeviersSectionProps,
  'places' | 'selectedLevierId' | 'selectedCategorie' | 'onLevierSelected'
>;

type SousLeviersViewProps = Pick<
  LeviersSectionProps,
  | 'places'
  | 'preselectedActions'
  | 'selectedLevierId'
  | 'selectedCategorie'
  | 'onLevierSelected'
>;

type PriorisationBoardProps = {
  collectiviteId: number;
  leviers: LevierPriorisation[];
  places: LevierPlace[];
  levierToPrioritizeId?: LevierId;
  potentiels: PotentielsReduction;
  preselection: Preselection;
  levierSidePanel: LevierSidePanel;
  leviersView: LeviersViewState;
};

type PriorisationContentProps = Omit<
  PriorisationBoardProps,
  'leviers' | 'potentiels'
> & {
  leviersQuery: LeviersPriorisationQuery;
};

type PriorisationBoardGateProps = {
  collectiviteId: number;
  hasMobilisation: boolean;
  children: ReactNode;
};

const toPreselectedCountByLevier = (
  preselection: Preselection
): PreselectedCountByLevier => {
  const countByLevier = countBy(
    preselection.actions.flatMap(({ leviers }) => leviers),
    (levier) => levier
  );
  return new Map(
    levierIdEnumValues.map((levierId) => [
      levierId,
      countByLevier[levierId] ?? 0,
    ])
  );
};

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

const PriorisationAlerts = ({
  potentiels,
}: PriorisationAlertsProps): JSX.Element => {
  const isPotentielUnavailable = potentiels.status === 'indisponible';
  return (
    <div className="flex flex-col gap-4">
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
  selectedCategorie,
  onLevierSelected,
}: BreakdownViewProps): JSX.Element => (
  <LeviersMondrianChart
    places={places}
    selectedLevierId={selectedLevierId}
    selectedCategorie={selectedCategorie}
    onLevierSelected={onLevierSelected}
  />
);

const SousLeviersView = ({
  places,
  preselectedActions,
  selectedLevierId,
  selectedCategorie,
  onLevierSelected,
}: SousLeviersViewProps): JSX.Element => (
  <SousLeviersChart
    places={places}
    preselectedActions={preselectedActions}
    selectedLevierId={selectedLevierId}
    selectedCategorie={selectedCategorie}
    onLevierSelected={onLevierSelected}
  />
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

const PriorisationBoardGate = ({
  collectiviteId,
  hasMobilisation,
  children,
}: PriorisationBoardGateProps): JSX.Element => {
  if (hasMobilisation) {
    return <>{children}</>;
  }
  return (
    <div className="relative">
      <div inert className="pointer-events-none select-none blur-sm">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <PriorisationEmptyCard collectiviteId={collectiviteId} />
      </div>
    </div>
  );
};

const PriorisationBoard = ({
  collectiviteId,
  leviers,
  places,
  levierToPrioritizeId,
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
      <PriorisationSummary
        collectiviteId={collectiviteId}
        blindSpotCount={places.filter(isBlindSpot).length}
        levierToPrioritizeId={toLevierToPrioritizeId(places)}
        preselectedActionsCount={preselection.actions.length}
        onLevierSelected={levierSidePanel.select}
      />
      <PriorisationAlerts potentiels={potentiels} />
      <LeviersSection
        ref={leviersPanelRef}
        leviers={leviers}
        places={places}
        preselectedCountByLevier={preselectedCountByLevier}
        preselectedActions={preselection.actions}
        selectedLevierId={levierSidePanel.selectedLevierId}
        selectedCategorie={levierSidePanel.selectedCategorie}
        onLevierSelected={levierSidePanel.select}
        anchor={toAnchor({
          levierToPrioritizeId,
          elementRef: levierToPrioritizeRef,
        })}
        {...leviersView}
      />
    </div>
  );
};

const PriorisationContent = ({
  collectiviteId,
  leviersQuery,
  places,
  levierToPrioritizeId,
  preselection,
  levierSidePanel,
  leviersView,
}: PriorisationContentProps): JSX.Element =>
  match(leviersQuery)
    .with({ status: 'loading' }, () => <LoadingStatus />)
    .with({ status: 'error' }, ({ retry }) => (
      <ErrorCard title={appLabels.uneErreurEstSurvenue} retry={retry} />
    ))
    .with({ status: 'ready' }, ({ leviers, hasMobilisation, potentiels }) => (
      <PriorisationBoardGate
        collectiviteId={collectiviteId}
        hasMobilisation={hasMobilisation}
      >
        <PriorisationBoard
          collectiviteId={collectiviteId}
          leviers={leviers}
          places={places}
          levierToPrioritizeId={levierToPrioritizeId}
          potentiels={potentiels}
          preselection={preselection}
          levierSidePanel={levierSidePanel}
          leviersView={leviersView}
        />
      </PriorisationBoardGate>
    ))
    .exhaustive();

export const PriorisationLeviersView = (): JSX.Element => {
  const { collectiviteId } = useCurrentCollectivite();
  const leviersQuery = useLeviersPriorisation(collectiviteId);
  const upsertPertinence = useUpsertPertinence();
  const preselection = usePreselection();
  const plansQuery = useListPlans(collectiviteId, { limit: 1 });
  const { leviers, places, levierToPrioritizeId } =
    useLeviersPlaces(leviersQuery);
  const levierSidePanel = useLevierSidePanel({
    leviers,
    places,
    preselection,
    upsertPertinence,
    headerRef: priorisationTargets.useTarget('levierHeader'),
    actionsRef: priorisationTargets.useTarget('firstActionDeReference'),
  });
  const isLeviersReady = leviersQuery.status === 'ready';
  const hasMobilisation = isLeviersReady && leviersQuery.hasMobilisation;
  const isTourReady = hasMobilisation && preselection.isReady;
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
                onClick={restartOnMatrix}
              >
                {appLabels.priorisationVisiteRelancer}
              </Button>
            </VisibleWhen>
            <Button variant="outlined" disabled>
              {appLabels.priorisationMethodologie}
            </Button>
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
        places={places}
        levierToPrioritizeId={levierToPrioritizeId}
        preselection={preselection}
        levierSidePanel={levierSidePanel}
        leviersView={{ view, onViewChange: setView }}
      />
    </>
  );
};
