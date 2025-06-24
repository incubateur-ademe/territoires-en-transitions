import { useCollectiviteId } from '@/api/collectivites';
import { FetchedPlanAction } from '@/api/plan-actions';
import { usePlansActionsListe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import { makeTdbPlansEtActionsModuleUrl } from '@/app/app/paths';
import { useFichesActionCountBy } from '@/app/plans-action/fiches/_data/use-fiches-action-count-by';
import { Statuts } from '@/app/plans-action/plans/card/statuts';
import { ModuleContainer } from '@/app/tableaux-de-bord/modules/module/module.container';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Statut } from '@/domain/plans/fiches';
import { CountByRecordType } from '@/domain/utils';
import { Button } from '@/ui';

/**
 * Module unique car la page TDB synthétique
 * n'a pas encore de module enregistré dans la base.
 * À adapter lorsque ce sera le cas avec le module générique `SuiviPlansModule` dans `src/`.
 */
const SuiviPlansModule = () => {
  const collectiviteId = useCollectiviteId();

  const { data, isLoading } = usePlansActionsListe({});

  const displayedPlans = data?.plans.slice(0, 4) || [];

  if (isLoading) {
    return (
      <ModuleContainer>
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      </ModuleContainer>
    );
  }

  return (
    <ModuleContainer className="gap-8">
      <h6 className="mb-0">Suivi de l’avancée des plans</h6>
      <div className="flex flex-col gap-8">
        {displayedPlans.map((plan) => (
          <Plan key={plan.id} plan={plan} />
        ))}
      </div>
      <div className="flex mt-auto">
        <Button
          className="ml-auto"
          variant="underlined"
          size="sm"
          href={makeTdbPlansEtActionsModuleUrl({
            collectiviteId,
            module: 'suivi-plan-actions',
          })}
        >
          Voir tous les plans
        </Button>
      </div>
    </ModuleContainer>
  );
};

export default SuiviPlansModule;

const Plan = ({ plan }: { plan: FetchedPlanAction }) => {
  const { data: countByResponse } = useFichesActionCountBy('statut', {
    planActionIds: [plan.id],
  });

  if (!countByResponse) {
    return null;
  }

  const pourcentage = Math.round(
    (countByResponse.countByResult['Réalisé'].count /
      Object.values(countByResponse.countByResult).reduce(
        (sum, item) => sum + item.count,
        0
      )) *
      100 || 0
  );

  return (
    <div key={plan.id} className="flex flex-col gap-2">
      <div className="flex justify-between gap-6">
        <span className="uppercase font-bold text-primary-9">{plan.nom}</span>
        <span className="text-sm text-grey-8 font-medium">{pourcentage}%</span>
      </div>
      {countByResponse?.countByResult && (
        <Statuts
          statuts={countByResponse.countByResult as CountByRecordType<Statut>}
          fichesCount={countByResponse?.total || 0}
          display="row"
        />
      )}
    </div>
  );
};
