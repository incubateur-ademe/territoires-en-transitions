'use client';

import { useImportPlan } from '@/app/plans/plans/import-plan/data/use-import-plan';
import { UpsertPlanForm } from '@/app/plans/plans/upsert-plan/upsert-plan.form';
import { useSuperAdminMode } from '@/app/users/authorizations/super-admin-mode/super-admin-mode.provider';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useCollectiviteId } from '@tet/api/collectivites';

export const ImporterPlanPage = () => {
  const collectiviteId = useCollectiviteId();
  const { isSuperAdminRoleEnabled } = useSuperAdminMode();
  const { setToast } = useToastContext();
  const {
    mutate: importPlan,
    isLoading,
    errorMessage,
    clearError,
  } = useImportPlan();

  if (!isSuperAdminRoleEnabled) {
    return null;
  }

  return (
    <div className="max-w-xl">
      <h2 className="mb-6">Importer un plan</h2>
      <div className="space-y-6 border border-grey-3 rounded-lg p-6 bg-white">
        <UpsertPlanForm
          includeFileUpload
          clearSubmitErrorMessage={clearError}
          onSubmit={async ({ nom, typeId, pilotes, referents, file }) => {
            const result = await importPlan({
              file: file,
              collectiviteId,
              planName: nom,
              planType: typeId ?? undefined,
              pilotes: pilotes ?? undefined,
              referents: referents ?? undefined,
            });
            if (result.success) {
              setToast('success', 'Le plan a bien été importé');
            }
            return result.success;
          }}
          submitButtonText="Importer"
        />
        {isLoading && (
          <p className="text-grey-7">{`Import en cours, cela peut prendre quelques secondes.`}</p>
        )}
        {errorMessage && (
          <p
            className="text-red-600"
            dangerouslySetInnerHTML={{ __html: errorMessage }}
          />
        )}
      </div>
    </div>
  );
};
