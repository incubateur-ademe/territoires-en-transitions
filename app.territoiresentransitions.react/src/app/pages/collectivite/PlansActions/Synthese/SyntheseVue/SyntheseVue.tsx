import {Link, useParams} from 'react-router-dom';
import HeaderTitle from '../../components/HeaderTitle';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
  makeCollectivitePlansActionsSyntheseUrl,
  makeCollectivitePlansActionsSyntheseVueUrl,
} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {DesactiverLesFiltres} from 'ui/shared/filters/DesactiverLesFiltres';
import FiltersPlanAction, {PlanActionFilter} from '../FiltersPlanAction';
import {FiltersKeys} from '../../FicheAction/data/filters';
import {useFichesActionFiltresListe} from '../../FicheAction/data/useFichesActionFiltresListe';
import FicheActionCard from '../../FicheAction/FicheActionCard';
import {getIsAllSelected} from 'ui/shared/filters/commons';
import FiltresPrimaires from './FiltresPrimaires/FiltresPrimaires';
import FiltresSecondaires from './FiltresSecondaires';
import {generateVue} from '../utils';

const SyntheseVue = () => {
  const collectivite_id = useCollectiviteId();
  const {syntheseVue} = useParams<{syntheseVue: FiltersKeys}>();

  const pageUrl = makeCollectivitePlansActionsSyntheseVueUrl({
    collectiviteId: collectivite_id!,
    vue: syntheseVue,
  });

  const vue = generateVue(syntheseVue);

  const filters = useFichesActionFiltresListe({
    url: pageUrl,
    initialFilters: {
      collectivite_id: collectivite_id!,
    },
  });

  const selectPlan = (plan: PlanActionFilter) => {
    if (plan.id === 'tous' || plan.id === 'nc') {
      return undefined;
    }
    return [plan.id];
  };

  if (!vue) return null;

  return (
    <div className="w-full">
      <HeaderTitle
        customClass={{
          container: 'bg-indigo-700',
          text: 'text-[1.375rem]',
        }}
        titre={vue.titre}
        isReadonly
      />
      <div className="px-6">
        {/** Header */}
        <div className="py-6">
          <Link
            className="p-1 shrink-0 text-xs text-gray-500 underline !bg-none !shadow-none hover:text-gray-600"
            to={makeCollectivitePlansActionsSyntheseUrl({
              collectiviteId: collectivite_id!,
            })}
          >
            <span className="mr-1 fr-icon-arrow-left-line before:scale-75" />
            Retour à la synthèse
          </Link>
        </div>

        {/** Graph */}

        {/** Filtres */}
        <div className="flex items-baseline ">
          <h5 className="mb-0 mr-6">Filtrer</h5>
          <DesactiverLesFiltres
            onClick={() => filters.setFilters(filters.initialFilters)}
          />
        </div>
        <div className="flex flex-col gap-6 my-6">
          <FiltersPlanAction
            collectiviteId={collectivite_id!}
            initialPlan={
              filters.filters.axes && filters.filters.axes[0].toString()
            }
            onChangePlan={plan => {
              if (typeof plan.id === 'string' && getIsAllSelected([plan.id])) {
                const newFilters = filters.filters;
                delete newFilters.axes;
                filters.setFilters({...newFilters});
                // d'une option à l'autre
              } else {
                filters.setFilters({
                  ...filters.filters,
                  axes: selectPlan(plan),
                });
              }
            }}
          />
          <FiltresPrimaires vue={vue.id} filters={filters} />
        </div>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
          <FiltresSecondaires
            filtresSecondaires={vue.filtresSecondaires}
            filters={filters}
          />
        </div>

        {/** Fiches */}
        <div className="my-8 border-b border-gray-200" />
        <div className="mb-16">
          <p className="text-gray-500">
            {filters.total} fiche{filters.total > 1 && 's'} action correspond
            {filters.total > 1 && 'ent'} à votre recherche
          </p>
          <div className="grid grid-cols-2 gap-6">
            {filters.items.map(fiche => (
              <FicheActionCard
                key={fiche.id}
                displayAxe
                ficheAction={fiche}
                link={
                  fiche.plans && fiche.plans[0]
                    ? makeCollectivitePlanActionFicheUrl({
                        collectiviteId: collectivite_id!,
                        planActionUid: fiche.plans[0].id?.toString()!,
                        ficheUid: fiche.id?.toString()!,
                      })
                    : makeCollectiviteFicheNonClasseeUrl({
                        collectiviteId: collectivite_id!,
                        ficheUid: fiche.id?.toString()!,
                      })
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyntheseVue;
