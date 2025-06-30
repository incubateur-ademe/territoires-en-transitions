import { useCollectiviteId } from '@/api/collectivites';
import { makeCollectivitePlansActionsNouveauUrl } from '@/app/app/paths';
import { useCreatePlanAction } from '@/app/plans/plans/show-detailed-plan-action/data/useUpsertAxe';
import { PlanTypeDropdown } from '@/app/plans/plans/show-detailed-plan-action/PlanTypeDropdown';
import { TPlanType } from '@/app/types/alias';
import { Button, Field, Icon, Input } from '@/ui';
import { useState } from 'react';

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
          <Icon icon="edit-box-fill" size="lg" className="mr-2" />
          Créer un plan d’action
        </h3>
        <div className="flex flex-col gap-6 mt-2 mb-10 pt-16 pb-20 px-24 bg-primary-0 rounded-2xl">
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
          <PlanTypeDropdown
            type={plan.type?.id}
            onSelect={(type) => setPlan({ ...plan, type })}
          />
          <div className="flex items-center justify-end gap-6 mt-6">
            <Button
              variant="outlined"
              icon="arrow-left-line"
              href={makeCollectivitePlansActionsNouveauUrl({
                collectiviteId: collectivite_id!,
              })}
            >
              Revenir à l’étape précédente
            </Button>
            <Button onClick={handleCreate}>Valider</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreerPlan;
