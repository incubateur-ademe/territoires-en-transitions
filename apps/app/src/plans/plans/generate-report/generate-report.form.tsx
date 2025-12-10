import { usePlanTypeListe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanTypeListe';
import {
  Plan,
  ReportGenerationRequest,
  reportGenerationRequestSchema,
} from '@/domain/plans';
import { Checkbox, Field, Input } from '@/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';
import { PlanFicheSelector } from './plan-fiche-selector';

type GenerateReportFormProps = {
  formId?: string;
  plan: Plan;
};

export function GenerateReportForm({ formId, plan }: GenerateReportFormProps) {
  const { options: planTypesOptions } = usePlanTypeListe();
  const [includeAllFiches, setIncludeAllFiches] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReportGenerationRequest>({
    resolver: zodResolver(reportGenerationRequestSchema),
    mode: 'onChange',
    defaultValues: {
      collectiviteId: plan.collectiviteId,
      planId: plan.id,
      templateKey: 'general_bilan_template',
      ficheIds: undefined,
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
        console.log(data);
      })}
      className="flex flex-col gap-6"
    >
      <Field
        title="Fichier Excel"
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
                accept=".png,.jpg,.jpeg"
                displaySize="md"
                onChange={(e) => field.onChange(e.target.files?.[0] ?? null)}
              />
            </>
          )}
        />
      </Field>
      <Field title="Fiches à inclure">
        <div className="flex flex-col gap-4">
          <Checkbox
            label="Toutes les fiches"
            checked={includeAllFiches}
            onChange={(e) => {
              const checked = e.target.checked;
              setIncludeAllFiches(checked);
              if (checked) {
                setValue('ficheIds', undefined);
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
