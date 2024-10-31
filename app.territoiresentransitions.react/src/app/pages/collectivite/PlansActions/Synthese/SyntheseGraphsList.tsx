import { usePlanActionTableauDeBord } from './data/usePlanActionTableauDeBord';
import PictoLeaf from 'ui/pictogrammes/PictoLeaf';
import Link from 'next/link';
import {
  makeCollectivitePlansActionsNouveauUrl,
  makeCollectivitePlansActionsSyntheseVueUrl,
} from 'app/paths';
import { PlanActionFilter } from './FiltersPlanAction';
import { generateSyntheseGraphData } from './utils';
import Chart from 'ui/charts/Chart';
import { Card } from '@tet/ui';

type SyntheseGraphsListProps = {
  collectiviteId: number;
  selectedPlan: PlanActionFilter;
  withoutPlan: boolean | null;
  isReadonly: boolean;
};

/**
 * Liste des graphes affichés dans la page Synthèse
 *
 * @param collectiviteId - (number) id de la collectivité affichée
 * @param planId - (number | null) id du plan d'action affiché
 * @param withoutPlan - (boolean | null) affichage des données sans plan d'action
 */
const SyntheseGraphsList = ({
  collectiviteId,
  selectedPlan,
  withoutPlan,
  isReadonly,
}: SyntheseGraphsListProps): JSX.Element => {
  const selectedPlanId = (plan: PlanActionFilter) => {
    if (plan.id === 'tous' || plan.id === 'nc') {
      return null;
    }

    return plan.id;
  };

  const { data, isLoading } = usePlanActionTableauDeBord(
    collectiviteId,
    selectedPlanId(selectedPlan),
    withoutPlan
  );

  return data ? (
    <div className="fr-grid-row fr-grid-row--gutters">
      {generateSyntheseGraphData(data).map(
        (graph) =>
          !!graph.data.length && (
            <div key={graph.title} className="fr-col-sm-12 fr-col-xl-6">
              <Card
                dataTest={`lien-graph-${graph.id}`}
                href={
                  graph.id === 'echeance'
                    ? undefined
                    : `${makeCollectivitePlansActionsSyntheseVueUrl({
                        collectiviteId,
                        vue: graph.id,
                      })}${
                        typeof selectedPlan.id === 'number'
                          ? `?axes=${selectedPlan.id}`
                          : ''
                      }`
                }
              >
                <div className="mb-2 text-center">{graph.title}</div>
                <div className="font-normal">
                  <Chart
                    donut={{
                      chart: {
                        data: graph.data,
                        displayOutsideLabel:
                          graph.id === 'statuts' || graph.id === 'priorites',
                      },
                    }}
                  />
                </div>
              </Card>
            </div>
          )
      )}
    </div>
  ) : isLoading ? (
    <div>Chargement en cours.</div>
  ) : (
    <div className="flex flex-col items-center mt-8">
      <PictoLeaf className="w-24 fill-gray-400" />
      <div className="my-6 text-gray-500">
        Aucune fiche action pour l’instant
      </div>
      {!isReadonly && (
        <div className="flex justify-center mt-6">
          <Link
            className="fr-btn"
            href={makeCollectivitePlansActionsNouveauUrl({
              collectiviteId,
            })}
          >
            Créer ou importer un plan d&apos;action
          </Link>
        </div>
      )}
    </div>
  );
};

export default SyntheseGraphsList;
