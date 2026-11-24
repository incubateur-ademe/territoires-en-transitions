'use client';

import { appLabels } from '@/app/labels/catalog';
import { Checkbox, Field, Textarea } from '@tet/ui';
import type { Control, UseFormRegister } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import type { AiImportFormConfig } from './ai-import-form.config';
import type { AiImportFormValues } from './ai-import-form.rules';

const INSTRUCTIONS_INPUT_ID = 'ai-import-instructions';
// La limite du serveur : au-delà, l'import est refusé.
const INSTRUCTIONS_MAX_LENGTH = 2000;

export const AiImportExtractionOptionsFields = ({
  control,
  register,
  config,
  isSuperAdminRoleEnabled,
}: {
  control: Control<AiImportFormValues>;
  register: UseFormRegister<AiImportFormValues>;
  config: AiImportFormConfig;
  isSuperAdminRoleEnabled: boolean;
}) => {
  if (config.fixedExtractionOptions) return null;

  return (
    <>
      {isSuperAdminRoleEnabled ? (
        <Field
          title={appLabels.importPlanIaChampInstructions}
          hint={appLabels.importPlanIaChampInstructionsAide}
          htmlFor={INSTRUCTIONS_INPUT_ID}
        >
          <Textarea
            id={INSTRUCTIONS_INPUT_ID}
            rows={3}
            maxLength={INSTRUCTIONS_MAX_LENGTH}
            placeholder={appLabels.importPlanIaChampInstructionsExemple}
            {...register('instructions')}
          />
        </Field>
      ) : null}
      <div className="flex flex-col gap-3">
        {isSuperAdminRoleEnabled ? (
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
        ) : null}
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
    </>
  );
};
