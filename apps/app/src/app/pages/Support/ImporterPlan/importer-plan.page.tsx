'use client';

import { useImportPlan } from '@/app/plans/plans/import-plan/data/use-import-plan';
import { UpsertPlanForm } from '@/app/plans/plans/upsert-plan/upsert-plan.form';
import { useSuperAdminMode } from '@/app/users/authorizations/super-admin-mode/super-admin-mode.provider';
import { useCollectiviteId } from '@tet/api/collectivites';

export const ImporterPlanPage = () => {
  const collectiviteId = useCollectiviteId();
  const { isSuperAdminRoleEnabled } = useSuperAdminMode();
  const { mutate: importPlan, isLoading, errorMessage } = useImportPlan();

  if (!isSuperAdminRoleEnabled) {
    return null;
  }

  return (
    <div className="max-w-xl">
      <h2>Importer un plan</h2>
      <div className="space-y-6 border border-grey-3 rounded-lg p-6 bg-white">
        <UpsertPlanForm
          includeFileUpload
          onSubmit={async ({ nom, typeId, pilotes, referents, file }) => {
            await importPlan({
              file: file,
              collectiviteId,
              planName: nom,
              planType: typeId ?? undefined,
              pilotes: pilotes ?? undefined,
              referents: referents ?? undefined,
            });
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
