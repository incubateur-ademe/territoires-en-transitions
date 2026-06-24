'use client';

import { appLabels } from '@/app/labels/catalog';
import { Colon } from '@/app/ui/colon';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Checkbox, Field, Input, Select } from '@tet/ui';
import { ReactElement } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useListPlanTypes } from '../use-list-plan-types';

const ACCEPTED_FILE_MIME_TYPES = [
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const aiImportFormSchema = z.object({
  file: z
    .file({ message: appLabels.importPlanIaFichierRequis })
    .refine((file) => ACCEPTED_FILE_MIME_TYPES.includes(file.type), {
      message: appLabels.importPlanIaFormatNonSupporte,
    }),
  planName: z.string().min(1, appLabels.importPlanIaNomRequis),
  planType: z.number().nullable(),
  instructions: z.string(),
  withVerifications: z.boolean(),
  withSousActions: z.boolean(),
});

const PDF_MIME_TYPE = 'application/pdf';

export type AiImportFormValues = z.infer<typeof aiImportFormSchema>;

const FILE_INPUT_ID = 'input-file';
const PLAN_NAME_INPUT_ID = 'ai-import-plan-name';
const INSTRUCTIONS_INPUT_ID = 'ai-import-instructions';

export const AiImportForm = ({
  onSubmit,
  cancelButton,
}: {
  onSubmit: (values: AiImportFormValues) => Promise<void>;
  cancelButton: ReactElement;
}) => {
  const { options: planTypesOptions } = useListPlanTypes();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AiImportFormValues>({
    resolver: zodResolver(aiImportFormSchema),
    mode: 'onChange',
    defaultValues: {
      planName: '',
      planType: null,
      instructions: '',
      withVerifications: true,
      withSousActions: true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Field
        title={appLabels.importPlanIaChampFichier}
        htmlFor={FILE_INPUT_ID}
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
                accept=".pdf,.csv,.xls,.xlsx"
                displaySize="md"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0];
                  field.onChange(selectedFile ?? undefined);
                  if (selectedFile) {
                    setValue(
                      'withVerifications',
                      selectedFile.type === PDF_MIME_TYPE
                    );
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
      <Field
        title={appLabels.importPlanIaChampNomPlan}
        htmlFor={PLAN_NAME_INPUT_ID}
        state={errors.planName ? 'error' : 'default'}
        message={errors.planName?.message}
      >
        <Input id={PLAN_NAME_INPUT_ID} type="text" {...register('planName')} />
      </Field>
      <Field title={appLabels.importPlanIaChampTypePlan}>
        <Controller
          control={control}
          name="planType"
          render={({ field }) => (
            <Select
              options={planTypesOptions ?? []}
              values={field.value ?? undefined}
              onChange={(value) =>
                field.onChange(typeof value === 'number' ? value : null)
              }
            />
          )}
        />
      </Field>
      <Field
        title={appLabels.importPlanIaChampInstructions}
        htmlFor={INSTRUCTIONS_INPUT_ID}
      >
        <Input
          id={INSTRUCTIONS_INPUT_ID}
          type="text"
          {...register('instructions')}
        />
      </Field>
      <div className="flex flex-col gap-3">
        <Controller
          control={control}
          name="withVerifications"
          render={({ field }) => (
            <Checkbox
              variant="switch"
              label={appLabels.importPlanIaOptionVerifications}
              checked={field.value}
              onChange={(event) => field.onChange(event.target.checked)}
            />
          )}
        />
        <Controller
          control={control}
          name="withSousActions"
          render={({ field }) => (
            <Checkbox
              variant="switch"
              label={appLabels.importPlanIaOptionSousActions}
              checked={field.value}
              onChange={(event) => field.onChange(event.target.checked)}
            />
          )}
        />
      </div>
      <div className="flex items-center justify-end gap-6 mt-6">
        {cancelButton}
        <Button type="submit" disabled={isSubmitting} icon="upload-2-line">
          {isSubmitting ? <SpinnerLoader /> : appLabels.importPlanIaLancer}
        </Button>
      </div>
    </form>
  );
};
