import { Button, Field, Input, Modal } from '@/ui';
import { ReactNode, useState } from 'react';
import { TPlanType } from '@/app/types/alias';
import { useImportPlan } from '@/app/app/pages/collectivite/PlansActions/ParcoursCreationPlan/Import/useImportPlan';
import PlanTypeDropdown from '@/app/app/pages/collectivite/PlansActions/PlanAction/PlanTypeDropdown';

export type ImportPlanProps = {
  collectiviteId: number;
};

export const ImportPlanModal = ({
  collectiviteId,
  children,
}: ImportPlanProps & {
  children: ReactNode;
}) => {
  const [plan, setPlan] = useState<{ nom?: string; type?: TPlanType }>({});
  const [currentSelection, setCurrentSelection] = useState<File | undefined>();
  const {
    mutate : importPlan,
    isLoading,
    successMessage,
    setSuccessMessage,
    errorMessage,
    setErrorMessage,
  } = useImportPlan();

  const onDropFile = (files: FileList | null) => {
    if (files && files.length > 0) {
      setCurrentSelection(files[0]);
    }
  };

  const handleImport = async () => {
    if (currentSelection && plan.nom) {
      setErrorMessage(null);
      setSuccessMessage(null);
      await importPlan(
        currentSelection,
        collectiviteId,
        plan.nom,
        plan.type?.id
      );
    }
  };

  const handleClose = (close: () => void) => {
    setCurrentSelection(undefined); // Reset du fichier sélectionné
    setPlan({}); // Réinitialiser les infos du plan si besoin
    setErrorMessage(null);
    setSuccessMessage(null);
    close();
  };

  return (
    <Modal
      title="Importer un plan d'action"
      size="md"
      onClose={() => handleClose(close)}
      render={({ descriptionId, close }) => (
        <div id={descriptionId} className="space-y-6">
          {/* Nom du plan */}
          <Field
            title="Nom du plan d’action"
            hint="Exemple : Plan Climat Air Énergie territorial 2022-2026"
          >
            <Input
              data-test="PlanNomInput"
              type="text"
              onChange={(e) => setPlan({ ...plan, nom: e.target.value })}
            />
          </Field>
          {/* Type du plan */}
          <PlanTypeDropdown
            type={plan.type?.id}
            onSelect={(type) => setPlan({ ...plan, type })}
          />
          {/* Fichier excel */}
          <Field title="Fichier Excel">
            <Input
              type="file"
              accept=".xls,.xlsx"
              displaySize="md"
              onChange={(e) => onDropFile(e.target.files)}
            />

            {/* Affichage du fichier choisi */}
            {currentSelection && (
              <p className="mt-2 text-sm text-grey-7">
                Fichier sélectionné : <strong>{currentSelection.name}</strong>
              </p>
            )}
          </Field>
          {/* Boutons annuler et valider */}
          <div className="flex gap-4 justify-end">
            <Button variant="grey" size="sm" onClick={() => handleClose(close)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!currentSelection || !plan.nom || isLoading}
              onClick={handleImport}
            >
              {isLoading ? 'Import en cours...' : 'Importer'}
            </Button>
          </div>
          {successMessage && <p className="text-green-600">{successMessage}</p>}
          {isLoading && <p className="text-grey-7">{`Import en cours, cela peut prendre quelques secondes.`}</p>}
          {errorMessage && (<p className="text-red-600" dangerouslySetInnerHTML={{ __html: errorMessage }} />)}
        </div>
      )}
    >
      {children as React.ReactElement}
    </Modal>
  );
};
