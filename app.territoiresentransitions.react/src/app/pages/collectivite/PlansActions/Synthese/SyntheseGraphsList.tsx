import {usePlanActionTableauDeBord} from './data/usePlanActionTableauDeBord';
import PictoLeaf from 'ui/pictogrammes/PictoLeaf';
import ChartCard from 'ui/charts/ChartCard';
import {Link} from 'react-router-dom';
import {
  makeCollectivitePlansActionsNouveauUrl,
  makeCollectivitePlansActionsSyntheseVueUrl,
} from 'app/paths';
import {PlanActionFilter} from './FiltersPlanAction';
import {generateSyntheseGraphData} from './utils';
import classNames from 'classnames';

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

  const data = usePlanActionTableauDeBord(
    collectiviteId,
    selectedPlanId(selectedPlan),
    withoutPlan
  );

  return data ? (
    <div className="fr-grid-row fr-grid-row--gutters">
      {generateSyntheseGraphData(data).map(
        graph =>
          !!graph.data.length && (
            <div key={graph.title} className="fr-col-sm-12 fr-col-xl-6">
              <Link
                data-test={`lien-graph-${graph.id}`}
                className={classNames('group fr-col-sm-12 fr-col-xl-6', {
                  'cursor-default': graph.id === 'echeance',
                })}
                to={
                  graph.id === 'echeance'
                    ? '#'
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
                <ChartCard
                  chartType="donut"
                  chartProps={{
                    data: graph.data,
                    label: graph.id === 'statuts' || graph.id === 'priorites',
                  }}
                  chartInfo={{
                    title: graph.title,
                  }}
                  customStyle={{height: '350px', borderBottomWidth: '4px'}}
                  classNames={classNames({
                    'group-hover:bg-gray-50': graph.id !== 'echeance',
                  })}
                />
              </Link>
            </div>
          )
      )}
    </div>
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
            to={makeCollectivitePlansActionsNouveauUrl({
              collectiviteId,
            })}
          >
            Créer ou importer un plan d'action
          </Link>
        </div>
      )}
    </div>
  );
};

export default SyntheseGraphsList;
