import { UpsertPlanForm } from '@/app/plans/plans/upsert-plan/upsert-plan.form';
import { Button, Modal } from '@/ui';
import { PropsWithChildren } from 'react';
import { useImportPlan } from './data/use-import-plan';

export type ImportPlanProps = {
  collectiviteId: number;
};

export const ImportPlanModal = ({
  collectiviteId,
  children,
}: PropsWithChildren<ImportPlanProps>) => {
  const {
    mutate: importPlan,
    isLoading,
    successMessage,
    errorMessage,
  } = useImportPlan();

  return (
    <Modal
      title="Importer un plan d'action"
      size="md"
      onClose={close}
      render={({ descriptionId, close }) => (
        <div id={descriptionId} className="space-y-6">
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
            cancelButton={
              <Button variant="outlined" onClick={close} type="button">
                Annuler
              </Button>
            }
          />
          {successMessage && <p className="text-green-600">{successMessage}</p>}
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
      )}
    >
      {children as React.ReactElement}
    </Modal>
  );
};
