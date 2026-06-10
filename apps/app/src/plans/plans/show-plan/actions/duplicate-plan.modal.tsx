import { appLabels } from '@/app/labels/catalog';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field, Input, Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const duplicatePlanFormSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(1, appLabels.nomPlanRequis)
    .max(300, appLabels.nomPlanTropLong),
});

type DuplicatePlanFormValues = z.infer<typeof duplicatePlanFormSchema>;

type Props = {
  planNom: string | null;
  openState: OpenState;
  isPending: boolean;
  onDuplicate: (nom: string) => Promise<void>;
};

export const DuplicatePlanModal = ({
  planNom,
  openState,
  isPending,
  onDuplicate,
}: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<DuplicatePlanFormValues>({
    resolver: zodResolver(duplicatePlanFormSchema),
    mode: 'onChange',
    defaultValues: { nom: appLabels.nomCopiePlan({ nom: planNom }) },
  });

  const onValid = async ({ nom }: DuplicatePlanFormValues): Promise<void> => {
    await onDuplicate(nom);
  };

  return (
    <Modal
      size="sm"
      title={appLabels.dupliquerCePlan}
      openState={openState}
      render={() => (
        <form
          onSubmit={handleSubmit(onValid)}
          className="flex flex-col gap-4"
        >
          <Field
            title={appLabels.nomDuPlan}
            state={errors.nom ? 'error' : 'default'}
            message={errors.nom?.message}
          >
            <Input type="text" {...register('nom')} />
          </Field>
          <p className="sr-only" aria-live="polite">
            {isPending ? appLabels.duplicationEnCours : ''}
          </p>
        </form>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            children: appLabels.dupliquer,
            onClick: handleSubmit(onValid),
            disabled: isPending || !isValid,
          }}
        />
      )}
    />
  );
};
