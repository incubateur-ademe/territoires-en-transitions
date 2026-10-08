'use client';

import { useGetDocumentFile } from '@/app/collectivites/documents/data/use-get-document-file';
import { appLabels } from '@/app/labels/catalog';
import { Colon } from '@/app/ui/colon';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSuperAdminMode } from '@/app/users/authorizations/super-admin-mode/super-admin-mode.provider';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Alert, Button, Checkbox, Field, Input, Select } from '@tet/ui';
import { ReactElement, useCallback, useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useListPlanTypes } from '../use-list-plan-types';

// Filtre sur l'extension : le MIME d'un CSV varie selon l'OS (text/plain,
// application/vnd.ms-excel sous Windows avec Excel…). Le serveur tranche
// ensuite sur le contenu.
const ACCEPTED_FILE_EXTENSIONS = ['.pdf', '.docx', '.csv', '.xlsx'];

export const isAiImportAcceptedFilename = (filename: string) =>
  ACCEPTED_FILE_EXTENSIONS.some((extension) =>
    filename.toLowerCase().endsWith(extension)
  );

const isAcceptedFile = (file: File) => isAiImportAcceptedFilename(file.name);

const aiImportFormSchema = z.object({
  file: z
    .file({ message: appLabels.importPlanIaFichierRequis })
    .refine(isAcceptedFile, {
      message: appLabels.importPlanIaFormatNonSupporte,
    }),
  planName: z.string().min(1, appLabels.importPlanIaNomRequis),
  planType: z.number().nullable(),
  instructions: z.string(),
  withVerifications: z.boolean(),
  withSousActions: z.boolean(),
});

const PDF_MIME_TYPE = 'application/pdf';

export const isAiImportVerifiable = (file: File) => file.type === PDF_MIME_TYPE;

export type AiImportFormValues = z.infer<typeof aiImportFormSchema>;

/**
 * Valeurs proposées d'office quand l'appelant les connaît déjà (programme
 * d'actions PCAET) : l'utilisateur reste libre de les changer.
 */
export type AiImportDefaults = {
  /** Fichier de la bibliothèque, pré-sélectionné comme document. */
  fichierId?: number;
  planName?: string;
};

const FILE_INPUT_ID = 'input-file';
const PLAN_NAME_INPUT_ID = 'ai-import-plan-name';
const INSTRUCTIONS_INPUT_ID = 'ai-import-instructions';

export const AiImportForm = ({
  onSubmit,
  cancelButton,
  lockedPlanTypeId,
  defaults,
}: {
  onSubmit: (values: AiImportFormValues) => Promise<void>;
  cancelButton: ReactElement;
  /** Type imposé, affiché mais non modifiable (programme d'actions PCAET). */
  lockedPlanTypeId?: number;
  defaults?: AiImportDefaults;
}) => {
  const collectiviteId = useCollectiviteId();
  const { options: planTypesOptions } = useListPlanTypes();
  const { isSuperAdminRoleEnabled } = useSuperAdminMode();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<AiImportFormValues>({
    resolver: zodResolver(aiImportFormSchema),
    mode: 'onChange',
    defaultValues: {
      planName: defaults?.planName ?? '',
      planType: lockedPlanTypeId ?? null,
      instructions: '',
      withVerifications: true,
      withSousActions: true,
    },
  });

  const selectFile = useCallback(
    (selectedFile: File | undefined) => {
      if (!selectedFile) {
        return;
      }
      setValue('file', selectedFile, { shouldValidate: true });
      setValue('withVerifications', isAiImportVerifiable(selectedFile));
    },
    [setValue]
  );

  const { data: suggestedFile, isLoading: isLoadingSuggestedFile } =
    useGetDocumentFile({ collectiviteId, fichierId: defaults?.fichierId });
  // Une seule fois, et jamais par-dessus un fichier choisi pendant le
  // téléchargement : retiré, le fichier suggéré ne revient pas.
  const hasAppliedSuggestedFile = useRef(false);
  useEffect(() => {
    if (!suggestedFile || hasAppliedSuggestedFile.current) {
      return;
    }
    hasAppliedSuggestedFile.current = true;
    if (getValues('file') === undefined && isAcceptedFile(suggestedFile)) {
      selectFile(suggestedFile);
    }
  }, [suggestedFile, getValues, selectFile]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Alert
        state="info"
        description={
          <>
            <p className="mb-2">{appLabels.importPlanIaDescription}</p>
            <p className="mb-0">{appLabels.importPlanIaContact}</p>
          </>
        }
      />
      <Field
        title={appLabels.importPlanIaChampFichier}
        hint={appLabels.importPlanIaFormatsAcceptes}
        htmlFor={FILE_INPUT_ID}
        message={errors.file?.message}
        state={errors.file?.message ? 'error' : 'default'}
      >
        <Controller
          name="file"
          control={control}
          render={({ field }) =>
            // Retirer le fichier fait revenir la zone de dépôt.
            field.value ? (
              <div className="flex items-center justify-between gap-4 p-4 bg-grey-1 border border-grey-4 rounded-lg">
                <div className="text-sm text-grey-7 break-all">
                  <p className="mb-0">
                    {appLabels.fichierSelectionne}
                    <Colon />
                    <strong>{field.value.name}</strong>
                  </p>
                  {field.value === suggestedFile && (
                    <p className="mb-0 text-xs">
                      {appLabels.importPlanIaFichierSuggere}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="grey"
                  size="xs"
                  icon="close-line"
                  onClick={() => resetField('file')}
                  dataTest="ai-import.retirer-fichier"
                >
                  {appLabels.importPlanIaRetirerFichier}
                </Button>
              </div>
            ) : (
              <>
                <Input
                  type="file"
                  accept={ACCEPTED_FILE_EXTENSIONS.join(',')}
                  displaySize="md"
                  onChange={(event) => selectFile(event.target.files?.[0])}
                  onDropFiles={(files) => selectFile(files[0])}
                />
                {isLoadingSuggestedFile && (
                  <p className="mt-2 mb-0 flex items-center gap-2 text-sm text-grey-7">
                    <SpinnerLoader className="w-4 h-4" />
                    {appLabels.importPlanIaFichierSuggereChargement}
                  </p>
                )}
              </>
            )
          }
        />
      </Field>
      <Field
        title={appLabels.nomPlan}
        htmlFor={PLAN_NAME_INPUT_ID}
        state={errors.planName ? 'error' : 'default'}
        message={errors.planName?.message}
      >
        <Input id={PLAN_NAME_INPUT_ID} type="text" {...register('planName')} />
      </Field>
      <Field
        title={appLabels.typePlan}
        hint={
          lockedPlanTypeId !== undefined
            ? appLabels.importPlanIaTypeVerrouille
            : undefined
        }
      >
        <Controller
          control={control}
          name="planType"
          render={({ field }) => (
            <Select
              disabled={lockedPlanTypeId !== undefined}
              options={planTypesOptions ?? []}
              values={field.value ?? undefined}
              onChange={(value) =>
                field.onChange(typeof value === 'number' ? value : null)
              }
            />
          )}
        />
      </Field>
      {isSuperAdminRoleEnabled && (
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
      )}
      <div className="flex flex-col gap-3">
        {isSuperAdminRoleEnabled && (
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
        )}
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
