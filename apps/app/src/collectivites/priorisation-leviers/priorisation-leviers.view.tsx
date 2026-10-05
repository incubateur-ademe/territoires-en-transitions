'use client';

import { appLabels } from '@/app/labels/catalog';
import { BetaLabel } from '@/app/ui/beta.label';
import { LoadingStatus } from '@/app/ui/shared/loading-status';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { LevierId, levierIdEnumValues } from '@tet/domain/shared';
import { Alert, PageHeader, VisibleWhen } from '@tet/ui';
import { countBy, sumBy } from 'es-toolkit';
import { JSX, useMemo } from 'react';
import { match } from 'ts-pattern';
import {
  LeviersPriorisationQuery,
  useLeviersPriorisation,
} from './data/use-leviers-priorisation';
import {
  UpsertPertinence,
  useUpsertPertinence,
} from './data/use-upsert-pertinence';
import { LevierCardInfo } from './levier-card-info';
import { LeviersMatrixChart } from './leviers-matrix.chart';
import { LeviersWithoutPotentielList } from './leviers-without-potentiel.list';
import { PreselectionSection } from './preselection.section';
import { PriorisationMetrics } from './priorisation.metrics';
import {
  LevierPriorisation,
  PotentielsReduction,
} from './to-leviers-priorisation';
import {
  isBlindSpot,
  LevierPlace,
  PreselectedCountByLevier,
  toLeviersPlaces,
  toLeviersWithoutPotentiel,
} from './to-matrix-points';
import { useLevierSidePanel } from './use-levier-side-panel';
import { Preselection, usePreselection } from './use-preselection';

type PriorisationAlertsProps = {
  hasMobilisation: boolean;
  potentiels: PotentielsReduction;
};

type MatrixSectionProps = {
  leviers: LevierPriorisation[];
  places: LevierPlace[];
  preselectedCountByLevier: PreselectedCountByLevier;
  selectedLevierId?: LevierId;
  onLevierSelected: (levierId: LevierId) => void;
};

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

const MatrixSection = ({
  leviers,
  places,
  preselectedCountByLevier,
  selectedLevierId,
  onLevierSelected,
}: MatrixSectionProps): JSX.Element => {
  const leviersWithoutPotentiel = toLeviersWithoutPotentiel(leviers);
  const hasLeviersWithoutPotentiel = leviersWithoutPotentiel.length > 0;
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-grey-3 bg-white p-6">
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
    </div>
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
      <MatrixSection
        leviers={leviers}
        places={places}
        preselectedCountByLevier={preselectedCountByLevier}
        selectedLevierId={levierSidePanel.selectedLevierId}
        onLevierSelected={levierSidePanel.select}
      />
      <PreselectionSection preselection={preselection} />
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
      </PageHeader>
      <PriorisationContent
        leviersQuery={leviersQuery}
        preselection={preselection}
        upsertPertinence={upsertPertinence}
      />
    </>
  );
};
