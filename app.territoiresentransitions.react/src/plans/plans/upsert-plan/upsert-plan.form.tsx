import { PlanTypeDropdown } from '@/app/plans/plans/show-detailed-plan/plan-type.dropdown';
import { Button, Field, Input } from '@/ui';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  nom: z.string().min(1, 'Le nom du plan est requis'),
  type: z
    .object({
      id: z.number(),
      type: z.string(),
      categorie: z.string(),
      detail: z.string().nullable(),
    })
    .optional(),
});

type UpsertPlanPayload = z.infer<typeof schema>;

export const UpsertPlanForm = ({
  defaultValues,
  formId,
  showButtons = true,
  goBackToPreviousPage,
  onSubmit,
}: {
  defaultValues?: Partial<UpsertPlanPayload>;
  formId?: string;
  showButtons?: boolean;
  goBackToPreviousPage?: () => void;
  onSubmit: (data: UpsertPlanPayload) => void;
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UpsertPlanPayload>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues,
  });

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <Field
        title="Nom du plan d’action"
        hint="Exemple : Plan Climat Air Énergie territorial 2022-2026"
        state={errors.nom ? 'error' : 'default'}
        message={errors.nom?.message}
      >
        <Input data-test="PlanNomInput" type="text" {...register('nom')} />
      </Field>
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <PlanTypeDropdown
            type={field.value?.id}
            onSelect={(type) => field.onChange(type)}
            state={errors.type ? 'error' : 'default'}
            message={errors.type?.message}
          />
        )}
      />
      <div className="flex items-center justify-end gap-6 mt-6">
        <VisibleWhen condition={showButtons}>
          <VisibleWhen condition={!!goBackToPreviousPage}>
            <Button
              variant="outlined"
              icon="arrow-left-line"
              onClick={goBackToPreviousPage}
              type="button"
            >
              Revenir à l'étape précédente
            </Button>
          </VisibleWhen>
          <Button type="submit">Valider</Button>
        </VisibleWhen>
      </div>
    </form>
  );
};
