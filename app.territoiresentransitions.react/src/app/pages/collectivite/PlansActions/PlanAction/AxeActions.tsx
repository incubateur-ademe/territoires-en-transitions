import { useCollectiviteId } from '@/api/collectivites';
import { Button } from '@/ui';
import { useCreateFicheResume } from '../FicheAction/data/useCreateFicheResume';
import { PlanNode } from './data/types';
import { useAddAxe } from './data/useUpsertAxe';

type Props = {
  plan: PlanNode;
  axe: PlanNode;
};

export const AxeActions = ({ plan, axe }: Props) => {
  const collectiviteId = useCollectiviteId();

  const { mutate: addAxe } = useAddAxe(axe.id, axe.depth, plan.id);
  const { mutate: createFicheResume } = useCreateFicheResume({
    axeId: axe.id,
    planId: plan.id,
    axeFichesIds: axe.fiches,
  });

  return (
    <div className="flex items-center gap-6">
      <Button
        dataTest="AjouterAxe"
        size="xs"
        variant="outlined"
        onClick={() =>
          addAxe({ collectivite_id: collectiviteId, parent: axe.id })
        }
      >
        Ajouter un nouveau titre
      </Button>
      <Button size="xs" onClick={() => createFicheResume()}>
        Créer une fiche action
      </Button>
    </div>
  );
};
