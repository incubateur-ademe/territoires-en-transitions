import { useUpdatePlan } from '@/app/plans/plans/show-plan/data/use-update-plan';
import { UpsertPlanForm } from '@/app/plans/plans/upsert-plan/upsert-plan.form';
import { PlanNode, PlanReferentOrPilote, PlanType } from '@tet/domain/plans';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';

type Props = {
  plan: PlanNode;
  type: PlanType | null;
  openState: OpenState;
  referents: PlanReferentOrPilote[] | null;
  pilotes: PlanReferentOrPilote[] | null;
  defaultValues: {
    nom: string;
    typeId: number | null;
    referents?: PlanReferentOrPilote[];
    pilotes?: PlanReferentOrPilote[];
  };
};

const FORM_ID = 'update-plan-form';
export const UpdatePlanModal = ({ plan, openState, defaultValues }: Props) => {
  const { mutate: updatePlan } = useUpdatePlan({
    collectiviteId: plan.collectiviteId,
  });
  return (
    <Modal
      dataTest="ModifierPlanTitreModale"
      openState={openState}
      title="Modifier le plan d'action"
      render={({ close }) => (
        <UpsertPlanForm
          formId={FORM_ID}
          showButtons={false}
          defaultValues={defaultValues}
          onSubmit={async ({ nom, typeId, referents, pilotes }) => {
            await updatePlan({
              ...plan,
              nom,
              typeId: typeId ?? undefined,
              referents: referents ?? undefined,
              pilotes: pilotes ?? undefined,
            });
            close();
          }}
        />
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: close,
          }}
          btnOKProps={{
            form: FORM_ID,
          }}
        />
      )}
    />
  );
};
