import { usePlanTypeListe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanTypeListe';
import { TPlanType } from '@/app/types/alias';
import { Button, Field, Input, Select } from '@/ui';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  nom: z.string().min(1, 'Le nom du plan est requis'),
  typeId: z.number().nullable(),
});

type UpsertPlanPayload = z.infer<typeof schema>;

export const UpsertPlanForm = ({
  defaultValues,
  formId,
  showButtons = true,
  goBackToPreviousPage,
  onSubmit,
}: {
  defaultValues?: {
    nom: string;
    typeId?: number | null;
  };
  formId?: string;
  showButtons?: boolean;
  goBackToPreviousPage?: () => void;
  onSubmit: ({ nom, type }: { nom: string; type: TPlanType | null }) => void;
}) => {
  const { data: planTypes, options: planTypesOptions } = usePlanTypeListe();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<UpsertPlanPayload>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      nom: defaultValues?.nom,
      typeId: defaultValues?.typeId ?? null,
    },
  });
  console.log('errors', errors, watch());
  return (
    <form
      id={formId}
      onSubmit={handleSubmit((data) =>
        onSubmit({
          nom: data.nom,
          type: planTypes?.find((type) => type.id === data.typeId) ?? null,
        })
      )}
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
      <Field title="Type de plan d’action">
        <Controller
          control={control}
          name="typeId"
          render={({ field }) => {
            return (
              <Select
                dataTest="Type"
                options={planTypesOptions ?? []}
                values={field.value ?? undefined}
                onChange={(value) => {
                  field.onChange(value ?? null);
                }}
              />
            );
          }}
        />
      </Field>
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
