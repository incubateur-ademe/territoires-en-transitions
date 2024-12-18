import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import {
  SANS_STATUT_LABEL,
  statutToColor,
} from '@/app/app/pages/collectivite/PlansActions/FicheAction/utils';
import { ModuleDisplay } from '@/app/app/pages/collectivite/TableauDeBord/components/Module';
import Chart from '@/app/ui/charts/Chart';
import { Statut } from '@/domain/plans/fiches';
import { Tooltip } from '@/ui';

type Props = {
  statuts: {
    [key: string]: {
      count: number;
      value: Statut | null;
    };
  };
  fichesCount: number;
  display: ModuleDisplay;
};

/** Affichage des statuts des FA dans la carte d'un plan d'action */
const Statuts = ({ statuts, fichesCount, display }: Props) => {
  if (display === 'circular') {
    return (
      <Chart
        donut={{
          chart: {
            className: '!h-60',
            data: statuts
              ? Object.entries(statuts)
                  .map(([statut, { count, value }]) => ({
                    id: statut,
                    value: count,
                    color: statutToColor[value || SANS_STATUT_LABEL],
                  }))
                  .filter(({ value }) => value > 0)
              : [],
            centeredElement: (
              <div className="flex flex-col items-center">
                <span className="text-primary-9 text-2xl font-bold">
                  {fichesCount}
                </span>
                <span className="-mt-1 text-grey-6 font-medium">
                  action{`${fichesCount > 1 ? 's' : ''}`}
                </span>
              </div>
            ),
            displayOutsideLabel: false,
          },
        }}
      />
    );
  }

  if (display === 'row') {
    /** État sans fiche */
    if (fichesCount === 0) {
      return (
        <Tooltip
          openingDelay={0}
          label={<div className="font-normal">Aucune fiche dans ce plan</div>}
        >
          <div className="h-3 border border-grey-4 bg-grey-1 w-full rounded-full" />
        </Tooltip>
      );
    } else {
      /** État avec fiches */
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
              ([_, { count, value }]) =>
                count > 0 && (
                  <span
                    key={value || SANS_STATUT_LABEL}
                    className="h-3 first:rounded-s-full last:rounded-e-full"
                    style={{
                      width: `${(count / fichesCount) * 100}%`,
                      backgroundColor:
                        statutToColor[value || SANS_STATUT_LABEL],
                    }}
                  />
                )
            )}
          </div>
        </Tooltip>
      );
    }
  }
};

export default Statuts;
