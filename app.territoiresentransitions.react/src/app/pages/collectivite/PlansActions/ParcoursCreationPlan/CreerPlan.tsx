import { useState } from 'react';
import { useCreatePlanAction } from '../PlanAction/data/useUpsertAxe';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { makeCollectivitePlansActionsNouveauUrl } from 'app/paths';
import FormField from 'ui/shared/form/FormField';
import PlanTypeDropdown from '../PlanAction/PlanTypeDropdown';
import { TPlanType } from 'types/alias';
import Link from 'next/link';

const CreerPlan = () => {
  const collectivite_id = useCollectiviteId();

  const [plan, setPlan] = useState<{ nom?: string; type?: TPlanType }>({});

  const { mutate: createPlanAction } = useCreatePlanAction();

  const handleCreate = () => {
    createPlanAction({
      collectivite_id: collectivite_id!,
      nom: plan.nom,
      type: plan.type?.id,
    });
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col grow py-12">
      <div className="w-full mx-auto">
        <h3 className="mb-8">
          <span className="fr-icon-edit-box-fill mr-2" />
          Créer un plan d’action
        </h3>
        <div className="flex flex-col mt-2 mb-10 py-14 px-24 bg-[#f6f6f6]">
          <FormField
            label="Nom du plan d’action"
            hint="Exemple : Plan Climat Air Énergie territorial 2022-2026"
          >
            <input
              data-test="PlanNomInput"
              className="fr-input"
              onChange={(e) => setPlan({ ...plan, nom: e.target.value })}
            />
          </FormField>
          <PlanTypeDropdown
            type={plan.type?.id}
            onSelect={(type) => setPlan({ ...plan, type })}
          />
          <div className="flex items-center justify-end gap-6 mt-4">
            <Link
              className="fr-btn fr-btn--tertiary fr-btn--icon-left !mb-0 fr-icon-arrow-left-line hover:!bg-[#EEEEEE]"
              href={makeCollectivitePlansActionsNouveauUrl({
                collectiviteId: collectivite_id!,
              })}
            >
              Revenir à l’étape précédente
            </Link>

            <button className="fr-btn !mb-0" onClick={handleCreate}>
              Valider
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreerPlan;
