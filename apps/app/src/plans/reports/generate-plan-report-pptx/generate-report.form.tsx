import { zodResolver } from '@hookform/resolvers/zod';
import { Plan, generateReportInputSchema } from '@tet/domain/plans';
import { Checkbox, Field, Input } from '@tet/ui';
import { useEffect, useState } from 'react';
import { z } from 'zod';

import { Controller, useForm } from 'react-hook-form';
import { PlanFicheSelector } from './plan-fiche-selector';

// Form schema that accepts File for logoFile (will be converted to base64 before sending)
const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024; // 2 Mo en bytes

const generateReportFormSchema = generateReportInputSchema
  .extend({
    logoFile: z
      .instanceof(File)
      .optional()
      .nullable()
      .refine((file) => !file || file.size <= MAX_FILE_SIZE, {
        message: `Le fichier ne doit pas dépasser ${MAX_FILE_SIZE_MB} Mo`,
      }),
  })
  .partial({
    templateKey: true,
    includeFicheIndicateursSlides: true,
  });

export type GenerateReportFormArgs = z.infer<typeof generateReportFormSchema>;

type GenerateReportFormProps = {
  formId?: string;
  plan: Plan;
  disabled?: boolean;
  onSubmit: (data: GenerateReportFormArgs) => void;
};

export function GenerateReportForm({
  formId,
  plan,
  disabled,
  onSubmit,
}: GenerateReportFormProps) {
  const [includeAllFiches, setIncludeAllFiches] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<GenerateReportFormArgs>({
    resolver: zodResolver(generateReportFormSchema),
    mode: 'onChange',
    disabled,
    defaultValues: {
      planId: plan.id,
      templateKey: 'general_bilan_template',
      ficheIds: undefined,
      includeFicheIndicateursSlides: true,
    },
  });

  const logoFile = watch('logoFile');

  useEffect(() => {
    if (logoFile && logoFile instanceof File) {
      const objectUrl = URL.createObjectURL(logoFile);
      setImagePreview(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      setImagePreview(null);
    }
  }, [logoFile]);

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(async (data) => {
        onSubmit(data);
      })}
      className="flex flex-col gap-8"
    >
      <Field
        title="Ajoutez le logo de votre collectivité"
        hint={`Taille max : ${MAX_FILE_SIZE_MB} Mo. Formats : jpeg, jpg, png`}
        message={errors.logoFile?.message}
        state={errors.logoFile?.message ? 'error' : 'default'}
      >
        <Controller
          name="logoFile"
          control={control}
          render={({ field }) => (
            <>
              {field.value && imagePreview && (
                <div className="mt-2 text-sm text-grey-7 flex flex-col items-center gap-2">
                  <img
                    src={imagePreview}
                    alt="Aperçu du logo"
                    className="max-w-48 object-contain rounded-lg border border-grey-4 p-2 bg-grey-1"
                  />
                  <span>
                    Fichier sélectionné : <strong>{field.value.name}</strong>
                  </span>
                </div>
              )}
              <Input
                type="file"
                disabled={disabled}
                accept=".png,.jpg,.jpeg"
                displaySize="md"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file && file.size > MAX_FILE_SIZE) {
                    // Réinitialiser le champ de fichier
                    e.target.value = '';
                    // Définir l'erreur explicitement
                    setError('logoFile', {
                      type: 'manual',
                      message: `Le fichier ne doit pas dépasser ${MAX_FILE_SIZE_MB} Mo`,
                    });
                  } else {
                    field.onChange(file);
                  }
                }}
              />
            </>
          )}
        />
      </Field>
      <Field title="Actions à ajouter au rapport">
        <div className="flex flex-col gap-4 mt-2">
          <Checkbox
            label="Toutes les actions"
            checked={includeAllFiches}
            disabled={disabled}
            onChange={(e) => {
              const checked = e.target.checked;
              setIncludeAllFiches(checked);
              if (checked) {
                setValue('ficheIds', undefined);
              } else {
                setValue('ficheIds', []);
              }
            }}
          />
          {!includeAllFiches && (
            <Controller
              control={control}
              name="ficheIds"
              render={({ field }) => {
                return (
                  <PlanFicheSelector
                    disabled={disabled}
                    collectiviteId={plan.collectiviteId}
                    planId={plan.id}
                    values={field.value ?? undefined}
                    onChange={(args) => {
                      field.onChange(args.values ?? []);
                    }}
                  />
                );
              }}
            />
          )}
        </div>
      </Field>
    </form>
  );
}
