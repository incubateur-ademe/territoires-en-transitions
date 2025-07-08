import { useCollectiviteId } from '@/api/collectivites';
import { makeCollectivitePlansActionsNouveauUrl } from '@/app/app/paths';
import { useCreatePlanAction } from '@/app/plans/plans/show-detailed-plan/data/use-upsert-axe';
import { PlanTypeDropdown } from '@/app/plans/plans/show-detailed-plan/plan-type.dropdown';
import { Button, Field, Icon, Input } from '@/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  nom: z.string().min(1, 'Le nom du plan est requis'),
  planTypeId: z
    .number()
    .optional()
    .refine((val) => val !== undefined, {
      message: 'Le type de plan est requis',
    }),
});

type FormData = z.infer<typeof schema>;

const CreerPlan = () => {
  const collectiviteId = useCollectiviteId();
  const { mutate: createPlanAction } = useCreatePlanAction();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const onSubmit = (data: FormData) => {
    createPlanAction({
      collectivite_id: collectiviteId,
      nom: data.nom,
      type: data.planTypeId,
    });
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col grow py-12">
      <div className="w-full mx-auto">
        <h3 className="mb-8">
          <Icon icon="edit-box-fill" size="lg" className="mr-2" />
          Créer un plan d’action
        </h3>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6 mt-2 mb-10 pt-16 pb-20 px-24 bg-primary-0 rounded-2xl"
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
            name="planTypeId"
            render={({ field }) => (
              <PlanTypeDropdown
                type={field.value}
                onSelect={(type) => field.onChange(type?.id)}
                state={errors.planTypeId ? 'error' : 'default'}
                message={errors.planTypeId?.message}
              />
            )}
          />
          <div className="flex items-center justify-end gap-6 mt-6">
            <Button
              variant="outlined"
              icon="arrow-left-line"
              href={makeCollectivitePlansActionsNouveauUrl({
                collectiviteId,
              })}
            >
              Revenir à l’étape précédente
            </Button>
            <Button type="submit">Valider</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreerPlan;
