import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import { getChartOption } from '@/app/tableaux-de-bord/plans-action/fiches-action-count-by/utils/get-chart-option';
import { ReactECharts } from '@/app/ui/charts/echarts/ReactECharts';
import { SANS_STATUT_LABEL } from '@/backend/plans/fiches/shared/labels';
import { Statut } from '@/domain/plans/fiches';
import { Tooltip } from '@/ui';

import { statutFicheActionToColor } from '@/app/plans/fiches/utils';
import { PlanCardDisplay } from '@/app/plans/plans/card/plan.card';

type Props = {
  statuts: {
    [key: string]: {
      count: number;
      value: Statut | null;
    };
  };
  fichesCount: number;
  display: PlanCardDisplay;
};

const getStatutsChartOption = (
  statuts: Props['statuts'],
  fichesCount: number
) => {
  const countByResult = statuts
    ? Object.entries(statuts).reduce((acc, [statut, { count, value }]) => {
        if (count > 0) {
          acc[statut] = {
            count,
            value,
            label: statut,
          };
        }
        return acc;
      }, {} as Record<string, { count: number; value: Statut | null; label: string }>)
    : undefined;

  return getChartOption({
    displayItemsLabel: false,
    countByProperty: 'statut',
    countByTotal: fichesCount,
    countByResult,
  });
};

/** Affichage des statuts des FA dans la carte d'un plan d'action */
export const Statuts = ({ statuts, fichesCount, display }: Props) => {
  if (display === 'circular') {
    const option = getStatutsChartOption(statuts, fichesCount);

    return (
      <div className="h-60">
        <ReactECharts option={option} style={{ height: '100%' }} />
      </div>
    );
  }

  if (fichesCount === 0) {
    return (
      <Tooltip
        openingDelay={0}
        label={<div className="font-normal">Aucune fiche dans ce plan</div>}
      >
        <div className="h-3 border border-grey-4 bg-grey-1 w-full rounded-full" />
      </Tooltip>
    );
  }
  return (
    <Tooltip
      openingDelay={0}
      label={
        <div className="max-w-56 flex gap-2 flex-wrap">
          {Object.entries(statuts).map(
            ([statut, { count, value }]) =>
              count > 0 && (
                <BadgeStatut
                  key={statut}
                  statut={value || SANS_STATUT_LABEL}
                  count={count}
                  size="sm"
                />
              )
          )}
          {/** Si contient uniquement des fiches sans statut */}
          {fichesCount === statuts['null']?.count && (
            <div className="font-normal">
              Complétez les statuts de vos fiches action pour voir la
              répartition
            </div>
          )}
        </div>
      }
    >
      <div className="flex">
        {Object.entries(statuts).map(
          ([, { count, value }]) =>
            count > 0 && (
              <span
                key={value || SANS_STATUT_LABEL}
                className="h-3 first:rounded-s-full last:rounded-e-full"
                style={{
                  width: `${(count / fichesCount) * 100}%`,
                  backgroundColor:
                    statutFicheActionToColor[value || SANS_STATUT_LABEL],
                }}
              />
            )
        )}
      </div>
    </Tooltip>
  );
};
