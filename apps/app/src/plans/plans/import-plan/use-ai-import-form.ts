import { useGetDocumentFile } from '@/app/collectivites/documents/data/use-get-document-file';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useCallback, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { planTypesToOptions } from '../plan-types-to-options';
import { useListPlanTypes } from '../use-list-plan-types';
import { getAiImportFormConfig } from './ai-import-form.config';
import {
  aiImportFormSchema,
  isAiImportAcceptedFilename,
  isAiImportVerifiable,
  type AiImportDefaults,
  type AiImportFormValues,
} from './ai-import-form.rules';
import { useAiImportAccess } from './data/use-ai-import-access';
import { useFindPreviousAiImport } from './data/use-find-previous-ai-import';

export const useAiImportForm = ({
  lockedPlanTypeId,
  defaults,
}: {
  lockedPlanTypeId?: number;
  defaults?: AiImportDefaults;
}) => {
  const collectiviteId = useCollectiviteId();
  const { data: planTypes, isLoading: isLoadingPlanTypes } = useListPlanTypes();
  const {
    profiles,
    isLoading: isLoadingProfiles,
    isProfileAvailable,
    isSuperAdminRoleEnabled,
  } = useAiImportAccess();
  const getConfig = (planTypeId: number | null) =>
    getAiImportFormConfig(planTypes.find(({ id }) => id === planTypeId));
  const schema = aiImportFormSchema.superRefine((values, context) => {
    const config = getConfig(values.planType);
    if (!isAiImportAcceptedFilename(values.file.name, config.fileExtensions)) {
      context.addIssue({
        code: 'custom',
        path: ['file'],
        message: config.formatError,
      });
    }
  });
  const form = useForm<AiImportFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      planName: defaults?.planName ?? '',
      planType: lockedPlanTypeId ?? defaults?.planType ?? null,
      instructions: defaults?.instructions ?? '',
      withVerifications: defaults?.withVerifications ?? true,
      withSousActions: defaults?.withSousActions ?? true,
    },
  });
  const { control, getValues, setValue, trigger } = form;

  const selectFile = useCallback(
    (selectedFile: File | undefined) => {
      if (!selectedFile) return;
      setValue('file', selectedFile, { shouldValidate: true });
      setValue(
        'withVerifications',
        isAiImportVerifiable(selectedFile) &&
          (defaults?.withVerifications ?? true)
      );
    },
    [setValue, defaults?.withVerifications]
  );

  const {
    previousImport: suggestedFilePreviousImport,
    isLoading: isCheckingSuggestedFile,
  } = useFindPreviousAiImport({ fichierId: defaults?.fichierId });
  const suggestedFichierId =
    isCheckingSuggestedFile || suggestedFilePreviousImport !== null
      ? undefined
      : defaults?.fichierId;
  const { data: suggestedFile, isLoading: isLoadingSuggestedFile } =
    useGetDocumentFile({ collectiviteId, fichierId: suggestedFichierId });

  const selectedFile = useWatch({ control, name: 'file' });
  const selectedPlanTypeId = useWatch({
    control,
    name: 'planType',
  });
  const config = getConfig(selectedPlanTypeId);
  const isSelectedProfileAvailable = isProfileAvailable(config.profile);
  const { previousImport, isLoading: isCheckingSelectedFile } =
    useFindPreviousAiImport({ file: selectedFile });

  useEffect(() => {
    if (getValues('file')) void trigger('file');
  }, [config.profile, getValues, trigger]);

  const hasAppliedSuggestedFile = useRef(false);
  useEffect(() => {
    if (!suggestedFile || hasAppliedSuggestedFile.current) return;
    hasAppliedSuggestedFile.current = true;
    if (
      getValues('file') === undefined &&
      isAiImportAcceptedFilename(suggestedFile.name)
    ) {
      selectFile(suggestedFile);
    }
  }, [suggestedFile, getValues, selectFile]);

  return {
    form,
    config,
    profiles,
    planTypesOptions: planTypesToOptions(planTypes),
    selectedFile,
    selectedPlanTypeId,
    suggestedFile,
    previousImport,
    isProfileAvailable: isSelectedProfileAvailable,
    isLoadingProfiles,
    isLoadingPlanTypes,
    isLoadingSuggestedFile,
    isSuperAdminRoleEnabled,
    isSubmitDisabled:
      form.formState.isSubmitting ||
      isCheckingSelectedFile ||
      isLoadingPlanTypes ||
      !isSelectedProfileAvailable,
    selectFile,
  };
};
