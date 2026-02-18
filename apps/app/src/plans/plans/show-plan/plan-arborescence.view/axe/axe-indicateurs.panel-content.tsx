import { LinkIndicateursViewBase } from '@/app/plans/fiches/show-fiche/content/indicateurs/side-menu/link-indicateur.view';
import { PlanNode } from '@tet/domain/plans';
import { useListAxeIndicateurs } from '../../data/use-list-axe-indicateurs';

type AxeIndicateursPanelContentProps = {
  collectiviteId: number;
  axe: PlanNode;
  planId: number;
};

export const AxeIndicateursPanelContent = ({
  collectiviteId,
  axe,
  planId,
}: AxeIndicateursPanelContentProps) => {
  const { selectedIndicateurs, toggleIndicateur } = useListAxeIndicateurs({
    axe,
    collectiviteId,
    planId,
    enabled: true,
  });

  return (
    <LinkIndicateursViewBase
      dataTest="axe-indicateurs-panel"
      indicateurs={{
        list: selectedIndicateurs || [],
        update: (indicateur) => toggleIndicateur(indicateur),
      }}
    />
  );
};
