import { Statut } from '@tet/api/plan-actions';
import { Tooltip } from '@tet/ui';
import BadgeStatut from '@tet/app/pages/collectivite/PlansActions/components/BadgeStatut';
import { ModuleDisplay } from '@tet/app/pages/collectivite/TableauDeBord/components/Module';
import Chart from 'ui/charts/Chart';
import { statutToColor } from '@tet/app/pages/collectivite/PlansActions/FicheAction/utils';

type Props = {
  statuts: {
    [key: string]: {
      count: number;
      valeur: Statut;
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
              ? Object.entries(statuts).map(([statut, { count, valeur }]) => ({
                  id: statut,
                  value: count,
                  color: statutToColor[valeur],
                }))
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
                ([statut, { count, valeur }]) =>
                  count > 0 && (
                    <BadgeStatut
                      key={statut}
                      statut={valeur}
                      count={count}
                      size="sm"
                    />
                  )
              )}
              {/** Si contient uniquement des fiches sans statut */}
              {fichesCount === statuts['Sans statut']?.count && (
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
              ([_, { count, valeur }]) =>
                count > 0 && (
                  <span
                    key={valeur}
                    className="h-3 first:rounded-s-full last:rounded-e-full"
                    style={{
                      width: `${(count / fichesCount) * 100}%`,
                      backgroundColor: statutToColor[valeur],
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
