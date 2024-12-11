import { CollectiviteEngagee } from '@/api';
import { PlanCarte } from 'app/pages/CollectivitesEngagees/Views/PlanCarte';
import View, {
  CollectivitesEngageesView,
} from 'app/pages/CollectivitesEngagees/Views/View';
import { useFilteredPlans } from 'app/pages/CollectivitesEngagees/data/useFilteredPlans';
const PlansView = (props: CollectivitesEngageesView) => {
  /** Data */
  const { plans, plansCount, isLoading } = useFilteredPlans(props.filters);

  return (
    <View
      {...props}
      view="plans"
      data={plans}
      dataCount={plansCount}
      isLoading={isLoading}
      renderCard={(data) => {
        const plan = data as CollectiviteEngagee.TPlanCarte;
        return (
          <PlanCarte
            key={plan.id}
            plan={plan}
            canUserClickCard={props.canUserClickCard}
          />
        );
      }}
    />
  );
};

export default PlansView;
