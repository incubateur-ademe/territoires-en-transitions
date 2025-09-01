import { usePlanTypeListe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanTypeListe';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import {
  PlanReferentOrPilote,
  updatePlanPiloteSchema,
  updatePlanReferentSchema,
} from '@/domain/plans/plans';
import { Button, Field, Input, Select, VisibleWhen } from '@/ui';
import { zodResolver } from '@hookform/resolvers/zod';

import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const withoutFileSchema = z.object({
  nom: z.string().min(1, 'Le nom du plan est requis'),
  typeId: z.number().nullable(),
  referents: z.array(updatePlanReferentSchema).nullable(),
  pilotes: z.array(updatePlanPiloteSchema).nullable(),
  file: z.undefined(),
});

const withFileSchema = withoutFileSchema.omit({ file: true }).extend({
  file: z.instanceof(File, { message: 'Un fichier est requis' }),
});

type WithoutFilePayload = z.infer<typeof withoutFileSchema>;
type WithFilePayload = z.infer<typeof withFileSchema>;
type UpsertPlanPayload = WithoutFilePayload | WithFilePayload;
const isWithFilePayload = (payload: object): payload is WithFilePayload => {
  return 'file' in payload;
};

type BaseProps = {
  defaultValues?: {
    nom: string;
    typeId?: number | null;
    referents?: PlanReferentOrPilote[];
    pilotes?: PlanReferentOrPilote[];
  };
  formId?: string;
  showButtons?: boolean;
  cancelButton?: React.ReactElement;
  submitButtonText?: string;
};

export function UpsertPlanForm(
  props: BaseProps & {
    onSubmit: (data: WithoutFilePayload) => Promise<void>;
    withFile?: false | undefined;
  }
): JSX.Element;

export function UpsertPlanForm(
  props: BaseProps & {
    onSubmit: (data: WithFilePayload) => Promise<void>;
    withFile: true;
  }
): JSX.Element;

export function UpsertPlanForm({
  defaultValues,
  formId,
  showButtons = true,
  cancelButton,
  onSubmit,
  withFile,
  submitButtonText = 'Valider',
}: BaseProps & {
  onSubmit:
    | ((data: WithoutFilePayload) => Promise<void>)
    | ((data: WithFilePayload) => Promise<void>);
  withFile?: boolean;
}) {
  const { options: planTypesOptions } = usePlanTypeListe();

  const schema = withFile ? withFileSchema : withoutFileSchema;
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpsertPlanPayload>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      nom: defaultValues?.nom ?? '',
      typeId: defaultValues?.typeId ?? undefined,
      referents: defaultValues?.referents ?? [],
      pilotes: defaultValues?.pilotes ?? [],
    },
  });

  return (
    <form
      id={formId}
      onSubmit={handleSubmit((data) => {
        const submit = onSubmit as (
          data: WithoutFilePayload | WithFilePayload
        ) => Promise<void>;

        const basePayload: WithoutFilePayload = {
          nom: data.nom,
          typeId: data.typeId ?? null,
          referents: data.referents ?? null,
          pilotes: data.pilotes ?? null,
        };

        if (withFile && isWithFilePayload(data)) {
          return submit({
            ...basePayload,
            file: data.file,
          });
        }
        submit(basePayload);
      })}
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
      <VisibleWhen condition={withFile === true}>
        <Field
          title="Fichier Excel"
          message={errors.file?.message}
          state={errors.file?.message ? 'error' : 'default'}
        >
          <Controller
            name="file"
            control={control}
            render={({ field }) => (
              <>
                <Input
                  type="file"
                  accept=".xls,.xlsx"
                  displaySize="md"
                  onChange={(e) => field.onChange(e.target.files?.[0] ?? null)}
                />

                {field.value && (
                  <p className="mt-2 text-sm text-grey-7">
                    Fichier sélectionné : <strong>{field.value.name}</strong>
                  </p>
                )}
              </>
            )}
          />
        </Field>
      </VisibleWhen>
      <div className="flex items-center justify-end gap-6 mt-6">
        <VisibleWhen condition={showButtons}>
          {cancelButton}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <SpinnerLoader /> : submitButtonText}
          </Button>
        </VisibleWhen>
      </div>
    </form>
  );
}
