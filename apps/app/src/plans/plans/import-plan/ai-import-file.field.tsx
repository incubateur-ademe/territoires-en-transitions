'use client';

import { appLabels } from '@/app/labels/catalog';
import { Colon } from '@/app/ui/colon';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Button, Field, Input } from '@tet/ui';
import type { Control, FieldError } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import type { AiImportFormConfig } from './ai-import-form.config';
import type { AiImportFormValues } from './ai-import-form.rules';

const FILE_INPUT_ID = 'input-file';

export const AiImportFileField = ({
  control,
  config,
  error,
  suggestedFile,
  isLoadingSuggestedFile,
  selectFile,
  removeFile,
}: {
  control: Control<AiImportFormValues>;
  config: AiImportFormConfig;
  error?: FieldError;
  suggestedFile?: File;
  isLoadingSuggestedFile: boolean;
  selectFile: (file: File | undefined) => void;
  removeFile: () => void;
}) => (
  <Field
    title={appLabels.importPlanIaChampFichier}
    hint={config.fileHint}
    htmlFor={FILE_INPUT_ID}
    message={error?.message}
    state={error ? 'error' : 'default'}
  >
    <Controller
      name="file"
      control={control}
      render={({ field }) =>
        field.value ? (
          <div className="flex items-center justify-between gap-4 p-4 bg-grey-1 border border-grey-4 rounded-lg">
            <div className="text-sm text-grey-7 break-all">
              <p className="mb-0">
                {appLabels.fichierSelectionne}
                <Colon />
                <strong>{field.value.name}</strong>
              </p>
              {field.value === suggestedFile ? (
                <p className="mb-0 text-xs">
                  {appLabels.importPlanIaFichierSuggere}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outlined"
              size="xs"
              icon="close-line"
              aria-label={appLabels.importPlanIaRetirerFichier}
              title={appLabels.importPlanIaRetirerFichier}
              onClick={removeFile}
              dataTest="ai-import.retirer-fichier"
            />
          </div>
        ) : (
          <>
            <Input
              type="file"
              accept={config.fileExtensions.join(',')}
              displaySize="md"
              onChange={(event) => selectFile(event.target.files?.[0])}
              onDropFiles={(files) => selectFile(files[0])}
            />
            {isLoadingSuggestedFile ? (
              <p className="mt-2 mb-0 flex items-center gap-2 text-sm text-grey-7">
                <SpinnerLoader className="w-4 h-4" />
                {appLabels.importPlanIaFichierSuggereChargement}
              </p>
            ) : null}
          </>
        )
      }
    />
  </Field>
);
