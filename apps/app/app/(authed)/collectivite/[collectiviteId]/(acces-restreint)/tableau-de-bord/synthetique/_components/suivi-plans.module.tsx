import { useCollectiviteId } from '@/api/collectivites';
import { makeCollectivitePlansActionsListUrl } from '@/app/app/paths';
import { useFichesCountBy } from '@/app/plans/fiches/data/use-fiches-count-by';
import { Statuts } from '@/app/plans/plans/components/card/statuts';
import {
  PlanListItem,
  useListPlans,
} from '@/app/plans/plans/list-all-plans/data/use-list-plans';
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
export const SuiviPlansModule = ({
  listPlansQuery,
}: {
  listPlansQuery: ReturnType<typeof useListPlans>;
}) => {
  const collectiviteId = useCollectiviteId();

  const { plans, isLoading } = listPlansQuery;

  const first4Plans = plans.slice(0, 4);

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
        {first4Plans.map((plan) => (
          <Plan key={plan.id} plan={plan} />
        ))}
      </div>
      <div className="flex mt-auto">
        <Button
          className="ml-auto"
          variant="underlined"
          size="sm"
          href={makeCollectivitePlansActionsListUrl({
            collectiviteId,
          })}
        >
          Voir tous les plans
        </Button>
      </div>
    </ModuleContainer>
  );
};

const Plan = ({ plan }: { plan: PlanListItem }) => {
  const { data: countByResponse, isLoading } = useFichesCountBy('statut', {
    planActionIds: [plan.id],
  });

  const pourcentage = countByResponse
    ? Math.round(
        (countByResponse.countByResult['Réalisé'].count /
          Object.values(countByResponse.countByResult).reduce(
            (sum, item) => sum + item.count,
            0
          )) *
          100 || 0
      )
    : undefined;

  return (
    <div key={plan.id} className="flex flex-col gap-2">
      <div className="flex justify-between gap-6">
        <span className="uppercase font-bold text-primary-9">{plan.nom}</span>
        <span className="text-sm text-grey-8 font-medium">
          {pourcentage ?? '-'}%
        </span>
      </div>
      <Statuts
        statuts={
          countByResponse?.countByResult as
            | CountByRecordType<Statut>
            | undefined
        }
        fichesCount={countByResponse?.total || 0}
        display="row"
        isLoading={isLoading}
      />
    </div>
  );
};
