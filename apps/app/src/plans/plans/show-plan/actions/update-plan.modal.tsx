import { useUpdatePlan } from '@/app/plans/plans/show-plan/data/use-update-plan';
import { UpsertPlanForm } from '@/app/plans/plans/upsert-plan/upsert-plan.form';
import { Plan } from '@tet/domain/plans';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';

type Props = {
  plan: Plan;
  openState: OpenState;
};

const FORM_ID = 'update-plan-form';
export const UpdatePlanModal = ({ plan, openState }: Props) => {
  const { mutate: updatePlan } = useUpdatePlan({
    collectiviteId: plan.collectiviteId,
  });
  const defaultValues = {
    nom: plan.nom ?? 'Sans titre',
    typeId: plan.type?.id ?? null,
    referents: plan.referents ?? undefined,
    pilotes: plan.pilotes ?? undefined,
  };

  return (
    <Modal
      dataTest="ModifierPlanTitreModale"
      openState={openState}
      title="Modifier le plan"
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
