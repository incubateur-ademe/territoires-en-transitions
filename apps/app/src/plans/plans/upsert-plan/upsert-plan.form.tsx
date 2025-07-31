import { usePlanTypeListe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanTypeListe';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {
  PlanReferentOrPilote,
  updatePlanPiloteSchema,
  updatePlanReferentSchema,
} from '@/domain/plans/plans';
import { Button, Field, Input, Select, VisibleWhen } from '@/ui';
import { zodResolver } from '@hookform/resolvers/zod';

import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  nom: z.string().min(1, 'Le nom du plan est requis'),
  typeId: z.number().nullable(),
  referents: z.array(updatePlanReferentSchema).nullable(),
  pilotes: z.array(updatePlanPiloteSchema).nullable(),
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
    referents?: PlanReferentOrPilote[];
    pilotes?: PlanReferentOrPilote[];
  };
  formId?: string;
  showButtons?: boolean;
  goBackToPreviousPage?: () => void;
  onSubmit: (data: UpsertPlanPayload) => Promise<void>;
}) => {
  const { options: planTypesOptions } = usePlanTypeListe();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UpsertPlanPayload>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      nom: defaultValues?.nom,
      typeId: defaultValues?.typeId ?? null,
      referents: defaultValues?.referents ?? [],
      pilotes: defaultValues?.pilotes ?? [],
    },
  });
  return (
    <form
      id={formId}
      onSubmit={handleSubmit((data) =>
        onSubmit({
          nom: data.nom,
          typeId: data.typeId ?? null,
          referents: data.referents ?? null,
          pilotes: data.pilotes ?? null,
        })
      )}
      className="flex flex-col gap-6"
    >
      <Field
        title="Nom du plan d'action"
        hint="Exemple : Plan Climat Air Énergie territorial 2022-2026"
        state={errors.nom ? 'error' : 'default'}
        message={errors.nom?.message}
      >
        <Input data-test="PlanNomInput" type="text" {...register('nom')} />
      </Field>
      <Field title="Type de plan d'action">
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
      <Field title="Personne pilote">
        <Controller
          name="pilotes"
          control={control}
          render={({ field }) => (
            <PersonnesDropdown
              values={field.value
                ?.map((p) => p.tagId?.toString() ?? p.userId?.toString())
                .filter((x): x is string => !!x)}
              onChange={({ personnes }) => {
                field.onChange(
                  personnes.map((p) => ({
                    tagId: p.tagId ?? null,
                    userId: p.userId ?? null,
                  }))
                );
              }}
            />
          )}
        />
      </Field>
      <Field title="Élu·e référent·e">
        <Controller
          name="referents"
          control={control}
          render={({ field }) => (
            <PersonnesDropdown
              values={field.value
                ?.map((r) => r.tagId?.toString() ?? r.userId?.toString())
                .filter((x): x is string => !!x)}
              onChange={({ personnes }) => {
                field.onChange(
                  personnes.map((p) => ({
                    tagId: p.tagId ?? null,
                    userId: p.userId ?? null,
                  }))
                );
              }}
            />
          )}
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
              {`Revenir à l'étape précédente`}
            </Button>
          </VisibleWhen>
          <Button type="submit">Valider</Button>
        </VisibleWhen>
      </div>
    </form>
  );
};
