import { makeCollectivitePreselectionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { LevierId } from '@tet/domain/shared';
import { Button } from '@tet/ui';
import { JSX, ReactNode } from 'react';
import { SelectLevier } from './select-levier';

type PriorisationAnalyseProps = {
  actionsCount: number;
  plansCount: number;
};

type PriorisationSummaryProps = {
  collectiviteId: number;
  blindSpotCount: number;
  levierToPrioritizeId?: LevierId;
  preselectedActionsCount: number;
  onLevierSelected: SelectLevier;
};

type SummaryCardProps = {
  count: number;
  label: string;
  description: string;
  children: ReactNode;
};

const SummaryCard = ({
  count,
  label,
  description,
  children,
}: SummaryCardProps): JSX.Element => (
  <div className="flex flex-col gap-3 rounded-xl border border-grey-3 bg-white p-6">
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold leading-none text-primary-9">
        {count}
      </span>
      <span className="font-bold text-primary-9">{label}</span>
    </div>
    <p className="m-0 text-sm text-grey-8">{description}</p>
    {children}
  </div>
);

export const PriorisationAnalyse = ({
  actionsCount,
  plansCount,
}: PriorisationAnalyseProps): JSX.Element => (
  <p className="m-0 text-grey-8">
    {appLabels.priorisationAnalyse({ actionsCount, plansCount })}
  </p>
);

export const PriorisationSummary = ({
  collectiviteId,
  blindSpotCount,
  levierToPrioritizeId,
  preselectedActionsCount,
  onLevierSelected,
}: PriorisationSummaryProps): JSX.Element => {
  const hasLevierToPrioritize = levierToPrioritizeId !== undefined;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <SummaryCard
        count={blindSpotCount}
        label={appLabels.leviersAPrioriser({
          count: blindSpotCount,
          withoutCount: true,
        })}
        description={appLabels.leviersAPrioriserDescription}
      >
        {hasLevierToPrioritize && (
          <Button
            variant="outlined"
            size="sm"
            className="mt-auto self-start"
            onClick={() => onLevierSelected(levierToPrioritizeId)}
          >
            {appLabels.ouvrirLevierLePlusImportant}
          </Button>
        )}
      </SummaryCard>
      <SummaryCard
        count={preselectedActionsCount}
        label={appLabels.actionsSauvegardees({
          count: preselectedActionsCount,
          withoutCount: true,
        })}
        description={appLabels.actionsSauvegardeesDescription}
      >
        <Button
          size="sm"
          icon="bookmark-line"
          className="mt-auto self-start"
          href={makeCollectivitePreselectionUrl({ collectiviteId })}
        >
          {appLabels.voirMesActionsSauvegardees}
        </Button>
      </SummaryCard>
    </div>
  );
};
