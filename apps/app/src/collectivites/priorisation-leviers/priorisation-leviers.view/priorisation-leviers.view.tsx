'use client';

import { makeCollectivitePreselectionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
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
import { JSX, useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { LevierCardInfo } from '../levier-card-info';
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
import { PriorisationHelpModal } from './priorisation-help.modal';
import { PriorisationMetrics } from './priorisation.metrics';
import { SelectLevier } from './select-levier';

type PriorisationAlertsProps = {
  hasMobilisation: boolean;
  potentiels: PotentielsReduction;
};

type LeviersView = 'matrix' | 'sousLeviers' | 'breakdown';

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
  leviers: LevierPriorisation[];
  hasMobilisation: boolean;
  potentiels: PotentielsReduction;
  preselection: Preselection;
  upsertPertinence?: UpsertPertinence;
};

type PriorisationContentProps = {
  leviersQuery: LeviersPriorisationQuery;
  preselection: Preselection;
  upsertPertinence?: UpsertPertinence;
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

const LeviersSection = (props: LeviersSectionProps): JSX.Element => {
  const [view, setView] = useState<LeviersView>('matrix');
  return (
    <Tabs className="flex flex-col gap-4">
      <TabsList className="justify-start">
        <TabsTab
          label={appLabels.leviersAPrioriser}
          isActive={view === 'matrix'}
          onClick={() => setView('matrix')}
        />
        <TabsTab
          label={appLabels.vueEnsembleLeviers}
          isActive={view === 'breakdown'}
          onClick={() => setView('breakdown')}
        />
        <TabsTab
          label={appLabels.sousLeviersAPrioriser}
          isActive={view === 'sousLeviers'}
          onClick={() => setView('sousLeviers')}
        />
      </TabsList>
      <TabsPanel className="gap-4 rounded-xl border border-grey-3 bg-white p-6">
        {match(view)
          .with('matrix', () => <MatrixView {...props} />)
          .with('sousLeviers', () => <SousLeviersView {...props} />)
          .with('breakdown', () => <BreakdownView {...props} />)
          .exhaustive()}
      </TabsPanel>
    </Tabs>
  );
};

const PriorisationBoard = ({
  leviers,
  hasMobilisation,
  potentiels,
  preselection,
  upsertPertinence,
}: PriorisationBoardProps): JSX.Element => {
  const places = useMemo(() => toLeviersPlaces(leviers), [leviers]);
  const preselectedCountByLevier = useMemo(
    () => toPreselectedCountByLevier(preselection),
    [preselection]
  );
  const levierSidePanel = useLevierSidePanel({
    leviers,
    preselection,
    upsertPertinence,
  });

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
        leviers={leviers}
        places={places}
        preselectedCountByLevier={preselectedCountByLevier}
        selectedLevierId={levierSidePanel.selectedLevierId}
        onLevierSelected={levierSidePanel.select}
      />
    </div>
  );
};

const PriorisationContent = ({
  leviersQuery,
  preselection,
  upsertPertinence,
}: PriorisationContentProps): JSX.Element =>
  match(leviersQuery)
    .with({ status: 'loading' }, () => <LoadingStatus />)
    .with({ status: 'error' }, ({ retry }) => (
      <ErrorCard title={appLabels.uneErreurEstSurvenue} retry={retry} />
    ))
    .with({ status: 'ready' }, ({ leviers, hasMobilisation, potentiels }) => (
      <PriorisationBoard
        leviers={leviers}
        hasMobilisation={hasMobilisation}
        potentiels={potentiels}
        preselection={preselection}
        upsertPertinence={upsertPertinence}
      />
    ))
    .exhaustive();

export const PriorisationLeviersView = (): JSX.Element => {
  const { collectiviteId } = useCurrentCollectivite();
  const leviersQuery = useLeviersPriorisation(collectiviteId);
  const upsertPertinence = useUpsertPertinence();
  const preselection = usePreselection();

  return (
    <>
      <PageHeader>
        <PageHeader.Title>
          <BetaLabel>{appLabels.priorisationLeviersTitre}</BetaLabel>
        </PageHeader.Title>
        <PageHeader.Actions>
          <div className="flex flex-wrap gap-4">
            <PriorisationHelpModal />
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
        preselection={preselection}
        upsertPertinence={upsertPertinence}
      />
    </>
  );
};
