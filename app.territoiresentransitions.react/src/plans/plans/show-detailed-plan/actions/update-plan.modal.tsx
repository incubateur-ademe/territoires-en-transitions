import { UpsertPlanForm } from '@/app/plans/plans/upsert-plan/upsert-plan.form';
import { TPlanType } from '@/app/types/alias';
import { Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { PlanNode } from '../../types';
import { useEditAxe } from '../data/use-edit-axe';

type Props = {
  plan: PlanNode;
  type: TPlanType | null;
  openState: OpenState;
};

const FORM_ID = 'update-plan-form';
export const UpdatePlanModal = ({ type, plan, openState }: Props) => {
  const { mutate: updateAxe } = useEditAxe(plan.id);
  return (
    <Modal
      dataTest="ModifierPlanTitreModale"
      openState={openState}
      title="Modifier le plan d’action"
      render={({ close }) => (
        <UpsertPlanForm
          formId={FORM_ID}
          showButtons={false}
          defaultValues={{
            nom: plan.nom,
            typeId: type?.id ?? undefined,
          }}
          onSubmit={({ nom, type }) => {
            updateAxe({
              ...plan,
              nom,
              type,
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
