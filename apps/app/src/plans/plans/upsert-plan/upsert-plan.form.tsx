import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { appLabels } from '@/app/labels/catalog';
import { Colon } from '@/app/ui/colon';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { zodResolver } from '@hookform/resolvers/zod';
import { PersonneId, personneIdSchema } from '@tet/domain/collectivites';
import {
  Button,
  Field,
  Input,
  InputDate,
  Select,
  VisibleWhen,
} from '@tet/ui';
import { JSX } from 'react';

import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useListPlanTypes } from '../use-list-plan-types';

/**
 * Validation croisée des dates : `dateFin >= dateDebut` uniquement quand les
 * deux dates sont renseignées (format `YYYY-MM-DD`, comparaison lexicographique
 * équivalente à la comparaison chronologique).
 */
const refinePlanFormDates = (
  data: { dateDebut?: string | null; dateFin?: string | null },
  ctx: z.RefinementCtx
) => {
  if (data.dateDebut && data.dateFin && data.dateFin < data.dateDebut) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dateFin'],
      message:
        'La date de fin doit être postérieure ou égale à la date de début',
    });
  }
};

const upsertPlanWithoutFileBaseSchema = z.object({
  nom: z.string().min(1, 'Le nom du plan est requis'),
  typeId: z.number().nullable(),
  referents: z.array(personneIdSchema).nullable(),
  pilotes: z.array(personneIdSchema).nullable(),
  dateDebut: z.string().nullable(),
  dateFin: z.string().nullable(),
  file: z.undefined(),
});

const upsertPlanWithFileBaseSchema = z.object({
  ...upsertPlanWithoutFileBaseSchema.shape,
  file: z.file({
    message: 'Un fichier est requis',
  }),
});

export const upsertPlanWithoutFileSchema =
  upsertPlanWithoutFileBaseSchema.superRefine(refinePlanFormDates);

const upsertPlanWithFileSchema =
  upsertPlanWithFileBaseSchema.superRefine(refinePlanFormDates);

type UpsertPlanWithoutFilePayload = z.infer<typeof upsertPlanWithoutFileSchema>;
type UpsertPlanWithFilePayload = z.infer<typeof upsertPlanWithFileSchema>;
type UpsertPlanPayload =
  | UpsertPlanWithoutFilePayload
  | UpsertPlanWithFilePayload;
const isWithFilePayload = (
  payload: object
): payload is UpsertPlanWithFilePayload => {
  return 'file' in payload;
};

type BaseProps = {
  defaultValues?: {
    nom: string;
    typeId?: number | null;
    referents?: PersonneId[];
    pilotes?: PersonneId[];
    dateDebut?: string | null;
    dateFin?: string | null;
  };
  formId?: string;
  showButtons?: boolean;
  cancelButton?: React.ReactElement;
  submitButtonText?: string;
  clearSubmitErrorMessage?: () => void;
};

export function UpsertPlanForm(
  props: BaseProps & {
    onSubmit: (data: UpsertPlanWithoutFilePayload) => Promise<boolean>;
    includeFileUpload?: false | undefined;
  }
): JSX.Element;

export function UpsertPlanForm(
  props: BaseProps & {
    onSubmit: (data: UpsertPlanWithFilePayload) => Promise<boolean>;
    includeFileUpload: true;
  }
): JSX.Element;

export function UpsertPlanForm({
  defaultValues,
  formId,
  showButtons = true,
  cancelButton,
  onSubmit,
  includeFileUpload,
  submitButtonText = 'Valider',
  clearSubmitErrorMessage,
}: BaseProps & {
  onSubmit:
    | ((data: UpsertPlanWithoutFilePayload) => Promise<boolean>)
    | ((data: UpsertPlanWithFilePayload) => Promise<boolean>);
  includeFileUpload?: boolean;
}) {
  const { options: planTypesOptions } = useListPlanTypes();

  const schema = includeFileUpload
    ? upsertPlanWithFileSchema
    : upsertPlanWithoutFileSchema;
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpsertPlanPayload>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      nom: defaultValues?.nom,
      typeId: defaultValues?.typeId ?? null,
      referents: defaultValues?.referents ?? [],
      pilotes: defaultValues?.pilotes ?? [],
      dateDebut: defaultValues?.dateDebut ?? null,
      dateFin: defaultValues?.dateFin ?? null,
    },
  });

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(async (data) => {
        const submit = onSubmit as (
          data: UpsertPlanWithoutFilePayload | UpsertPlanWithFilePayload
        ) => Promise<boolean>;

        const basePayload: UpsertPlanWithoutFilePayload = {
          nom: data.nom,
          typeId: data.typeId ?? null,
          referents: data.referents ?? null,
          pilotes: data.pilotes ?? null,
          dateDebut: data.dateDebut || null,
          dateFin: data.dateFin || null,
          file: undefined,
        };

        const file =
          includeFileUpload && isWithFilePayload(data) ? data.file : undefined;

        const result = await submit({ ...basePayload, file });
        if (result) {
          reset();
        }
      })}
      className="flex flex-col gap-6"
    >
      <Field
        title="Nom du plan"
        hint="Exemple : Plan Climat Air Énergie territorial 2022-2026"
        state={errors.nom ? 'error' : 'default'}
        message={errors.nom?.message}
      >
        <Input data-test="PlanNomInput" type="text" {...register('nom')} />
      </Field>
      <Field title="Type de plan">
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
      <div className="flex gap-6">
        <Field title={appLabels.planDateDebut} className="grow">
          <InputDate
            data-test="PlanDateDebutInput"
            {...register('dateDebut')}
          />
        </Field>
        <Field
          title={appLabels.planDateFin}
          className="grow"
          state={errors.dateFin ? 'error' : 'default'}
          message={errors.dateFin?.message}
        >
          <InputDate data-test="PlanDateFinInput" {...register('dateFin')} />
        </Field>
      </div>
      <Field title="Personne pilote">
        <Controller
          name="pilotes"
          control={control}
          render={({ field }) => (
            <PersonneTagDropdown
              dataTest="create-plan-pilote"
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
            <PersonneTagDropdown
              dataTest="create-plan-referent"
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
      <VisibleWhen condition={includeFileUpload === true}>
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
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    field.onChange(file);
                    if (file) {
                      clearSubmitErrorMessage?.();
                    }
                  }}
                />

                {field.value && (
                  <p className="mt-2 text-sm text-grey-7 break-all">
                    {appLabels.fichierSelectionne}
                    <Colon />
                    <strong>{field.value.name}</strong>
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
