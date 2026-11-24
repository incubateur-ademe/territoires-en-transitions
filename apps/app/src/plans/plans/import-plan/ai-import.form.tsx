'use client';

import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button, Field, Input, Select, Tooltip } from '@tet/ui';
import { ReactElement } from 'react';
import { Controller } from 'react-hook-form';
import type {
  AiImportDefaults,
  AiImportSubmission,
} from './ai-import-form.rules';
import { AiImportAvailabilityAlert } from './ai-import-availability.alert';
import { AiImportExtractionOptionsFields } from './ai-import-extraction-options.fields';
import { AiImportFileField } from './ai-import-file.field';
import { AiImportIntroductionAlert } from './ai-import-introduction.alert';
import { useGetOngoingAiImport } from './data/use-get-ongoing-ai-import';
import { PreviousAiImportAlert } from './previous-ai-import.alert';
import { useAiImportForm } from './use-ai-import-form';

const PLAN_NAME_INPUT_ID = 'ai-import-plan-name';

export const AiImportForm = ({
  onSubmit,
  cancelButton,
  lockedPlanTypeId,
  defaults,
}: {
  onSubmit: (submission: AiImportSubmission) => Promise<void>;
  cancelButton: ReactElement;
  /** Type imposé, affiché mais non modifiable (programme d'actions PCAET). */
  lockedPlanTypeId?: number;
  defaults?: AiImportDefaults;
}) => {
  const collectiviteId = useCollectiviteId();
  const { isOngoing } = useGetOngoingAiImport(collectiviteId);
  const disabledOngoingReason = isOngoing
    ? appLabels.erreursApi.IN_FLIGHT_JOB_EXISTS
    : undefined;
  const {
    form: {
      register,
      handleSubmit,
      control,
      resetField,
      formState: { errors, isSubmitting },
    },
    config,
    profiles,
    planTypesOptions,
    selectedPlanTypeId,
    suggestedFile,
    previousImport,
    isProfileAvailable,
    isLoadingProfiles,
    isLoadingPlanTypes,
    isLoadingSuggestedFile,
    isSuperAdminRoleEnabled,
    isSubmitDisabled,
    selectFile,
  } = useAiImportForm({ lockedPlanTypeId, defaults });
  const disableSubmit = isSubmitDisabled || isOngoing;

  return (
    <form
      onSubmit={handleSubmit((values) => {
        if (disableSubmit) return;
        return onSubmit({
          ...values,
          ...config.fixedExtractionOptions,
          profile: config.profile,
          confirmReimport: previousImport !== null,
        });
      })}
      className="flex flex-col gap-6"
    >
      <AiImportIntroductionAlert description={config.description} />
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
              dataTest="ai-import.plan-type"
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
      <AiImportAvailabilityAlert
        profiles={profiles}
        profile={config.profile}
        selectedPlanTypeId={selectedPlanTypeId}
        isLoading={isLoadingPlanTypes || isLoadingProfiles}
        isProfileAvailable={isProfileAvailable}
      />
      <AiImportFileField
        control={control}
        config={config}
        error={errors.file}
        suggestedFile={suggestedFile}
        isLoadingSuggestedFile={isLoadingSuggestedFile}
        selectFile={selectFile}
        removeFile={() => resetField('file')}
      />
      <AiImportExtractionOptionsFields
        control={control}
        register={register}
        config={config}
        isSuperAdminRoleEnabled={isSuperAdminRoleEnabled}
      />
      {previousImport && (
        <PreviousAiImportAlert previousImport={previousImport} />
      )}
      <div className="flex items-center justify-end gap-6 mt-6">
        {cancelButton}
        <Tooltip label={disabledOngoingReason}>
          <span
            className="inline-flex"
            tabIndex={disabledOngoingReason ? 0 : undefined}
          >
            <Button
              type="submit"
              disabled={disableSubmit}
              icon="upload-2-line"
              dataTest="ai-import.lancer"
              className="disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <SpinnerLoader />
              ) : previousImport ? (
                appLabels.importPlanIaRelancerQuandMeme
              ) : (
                appLabels.importPlanIaLancer
              )}
            </Button>
          </span>
        </Tooltip>
      </div>
    </form>
  );
};
