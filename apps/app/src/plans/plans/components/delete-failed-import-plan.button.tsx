import { appLabels } from '@/app/labels/catalog';
import { useDeletePlan } from '@/app/plans/plans/show-plan/data/use-delete-plan';
import { Button } from '@tet/ui';

/** Un import en échec laisse un plan vide, à supprimer avant de relancer. */
export const DeleteFailedImportPlanButton = ({
  planId,
}: {
  planId: number;
}) => {
  const { mutate: deletePlan, isPending } = useDeletePlan(planId);
  return (
    <Button
      variant="outlined"
      size="xs"
      icon="delete-bin-6-line"
      loading={isPending}
      onClick={() => deletePlan()}
      dataTest="plans.plan.supprimer-plan-echoue-button"
    >
      {appLabels.importPlanIaSupprimerPlanEchoue}
    </Button>
  );
};
