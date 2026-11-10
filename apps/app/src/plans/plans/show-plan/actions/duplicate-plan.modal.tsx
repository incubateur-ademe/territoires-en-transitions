import { appLabels } from '@/app/labels/catalog';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Field, Input, Modal, ModalFooter, Tooltip } from '@tet/ui';
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
  disabledReason?: string;
  onDuplicate: (nom: string) => Promise<void>;
};

export const DuplicatePlanModal = ({
  planNom,
  openState,
  isPending,
  disabledReason,
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

  const isSubmitDisabled = isPending || !isValid || !!disabledReason;

  const onValid = async ({ nom }: DuplicatePlanFormValues): Promise<void> => {
    if (isSubmitDisabled) return;
    await onDuplicate(nom);
  };

  return (
    <Modal
      size="sm"
      title={appLabels.dupliquerPlan}
      openState={openState}
      render={() => (
        <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-4">
          <Field
            title={appLabels.nomPlan}
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
        <ModalFooter variant="right">
          <Button variant="outlined" size="xs" onClick={close}>
            {appLabels.annuler}
          </Button>
          <Tooltip label={disabledReason}>
            <Button
              size="xs"
              onClick={handleSubmit(onValid)}
              disabled={isSubmitDisabled}
            >
              {appLabels.dupliquer}
            </Button>
          </Tooltip>
        </ModalFooter>
      )}
    />
  );
};
