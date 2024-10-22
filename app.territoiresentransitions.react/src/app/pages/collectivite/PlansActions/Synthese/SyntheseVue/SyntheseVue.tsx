import { FicheResume } from '@tet/api/plan-actions';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
  makeCollectivitePlansActionsSyntheseUrl,
  makeCollectivitePlansActionsSyntheseVueUrl,
} from 'app/paths';
import { useCollectiviteId } from 'core-logic/hooks/params';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import HeaderTitle from 'ui/HeaderTitle';
import { ITEM_ALL } from 'ui/shared/filters/commons';
import { DesactiverLesFiltres } from 'ui/shared/filters/DesactiverLesFiltres';
import FicheActionCard from '../../FicheAction/Carte/FicheActionCard';
import { FiltersKeys } from '../../FicheAction/data/filters';
import { useFichesActionFiltresListe } from '../../FicheAction/data/useFichesActionFiltresListe';
import FiltersPlanAction, { PlanActionFilter } from '../FiltersPlanAction';
import { generateSyntheseVue } from '../utils';
import FiltresPrimaires from './FiltresPrimaires/FiltresPrimaires';
import FiltresSecondaires from './FiltresSecondaires';
import SyntheseVueGraph from './SyntheseVueGraph';
import { useParams } from 'react-router-dom';

const SyntheseVue = () => {
  const collectivite_id = useCollectiviteId();
  const { syntheseVue } = useParams<{ syntheseVue: FiltersKeys }>();
  const search = useSearchParams();

  const pageUrl = makeCollectivitePlansActionsSyntheseVueUrl({
    collectiviteId: collectivite_id!,
    vue: syntheseVue,
  });

  const vue = generateSyntheseVue(syntheseVue);

  const [plan, setPlan] = useState<PlanActionFilter>({
    id: ITEM_ALL,
    name: 'tous',
  });

  const filtersData = useFichesActionFiltresListe({
    url: pageUrl,
    initialFilters: {
      collectivite_id: collectivite_id!,
    },
  });

  const { items, total, initialFilters, filters, setFilters, filtersCount } =
    filtersData;

  const selectPlan = (plan: PlanActionFilter) => {
    const newFilters = filters;
    if (plan.id === ITEM_ALL) {
      delete newFilters.sans_plan;
      delete newFilters.axes;
      return { ...newFilters };
    } else if (plan.id === 'nc') {
      delete newFilters.axes;
      return { ...filters, sans_plan: 1 };
    } else {
      delete newFilters.sans_plan;
      return { ...filters, axes: [plan.id] };
    }
  };

  if (!vue) return null;

  return (
    <div data-test="PageGraphSynthese" className="w-full">
      <HeaderTitle
        customClass={{ text: 'text-[1.375rem]' }}
        titre={vue.titre}
        isReadonly
      />
      <div className="px-6">
        {/** Header */}
        <div className="py-6">
          <Link
            className="p-1 shrink-0 text-xs text-gray-500 underline !bg-none !shadow-none hover:text-gray-600"
            href={makeCollectivitePlansActionsSyntheseUrl({
              collectiviteId: collectivite_id!,
            })}
          >
            <span className="mr-1 fr-icon-arrow-left-line before:scale-75" />
            Retour à la synthèse
          </Link>
        </div>

        {/** Graph */}
        <div className="min-h-[27rem] border border-b-4 border-gray-200">
          <SyntheseVueGraph vue={vue} plan={plan} />
        </div>

        {/** Filtres */}
        <div data-test="Filtres" className="flex flex-col gap-6 mt-8 mb-6">
          <FiltersPlanAction
            collectiviteId={collectivite_id!}
            initialPlan={
              (filters.sans_plan && 'nc') ||
              (filters.axes && filters.axes[0].toString())
            }
            getInitialPlan={(plan) => setPlan(plan)}
            onChangePlan={(plan) => {
              setFilters(selectPlan(plan));
              setPlan(plan);
            }}
          />
          <FiltresPrimaires vue={vue.id} filters={filtersData} />
        </div>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
          <FiltresSecondaires
            filtresSecondaires={vue.filtresSecondaires}
            filters={filtersData}
          />
        </div>

        {/** Divider */}
        <div className="my-8 border-b border-gray-200" />
        {/** Fiches */}
        <div className="mb-16">
          {search.toString().length && search.toString().length > 1 ? (
            <>
              <div className="flex items-baseline mb-8">
                <p
                  data-test="NombreFichesAction"
                  className="mb-0 mr-6 text-gray-500"
                >
                  {total} fiche{total > 1 && 's'} action correspond
                  {total > 1 && 'ent'} à votre recherche
                </p>
                {filtersCount > 1 && (
                  <DesactiverLesFiltres
                    onClick={() => setFilters(initialFilters)}
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-6">
                {items.map((fiche) => (
                  <FicheActionCard
                    key={fiche.id}
                    ficheAction={
                      ficheWithSelectedPlan(fiche, plan) as FicheResume
                    }
                    link={
                      plan.id !== 'nc'
                        ? makeCollectivitePlanActionFicheUrl({
                            collectiviteId: collectivite_id!,
                            planActionUid:
                              fiche.plans &&
                              fiche.plans[0] &&
                              plan.id === ITEM_ALL
                                ? fiche.plans[0].id?.toString()!
                                : plan.id.toString(),
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
            </>
          ) : (
            <div
              data-test="SelectionnerFiltre"
              className="mt-20 text-center text-gray-500"
            >
              Sélectionner des filtres pour afficher la liste des fiches action
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyntheseVue;

const ficheWithSelectedPlan = (fiche: FicheResume, plan: PlanActionFilter) => {
  if (plan.id !== ITEM_ALL && fiche.plans && fiche.plans) {
    const index = fiche.plans.findIndex((p) => p?.id === plan.id);
    return {
      ...fiche,
      plans: [fiche.plans[index]],
    };
  }
  return fiche;
};
