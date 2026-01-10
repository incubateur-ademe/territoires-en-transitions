import { LinkIndicateursView } from '@/app/plans/fiches/show-fiche/content/indicateurs/side-menu/link-indicateur.view';
import { PlanNode } from '@tet/domain/plans';
import { CollectiviteAccess } from '@tet/domain/users';
import { SideMenu } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useAxeIndicateurs } from '../data/use-axe-indicateurs';

type AxeIndicateursProps = {
  axe: PlanNode;
  collectivite: CollectiviteAccess;
  openState: OpenState;
};

export const AxeIndicateursPanel = ({
  axe,
  collectivite,
  openState,
}: AxeIndicateursProps) => {
  const { collectiviteId } = collectivite;

  const { selectedIndicateurs, toggleIndicateur: updateIndicateurs } =
    useAxeIndicateurs({
      axe,
      collectiviteId,
      enabled: openState.isOpen,
    });

  return (
    <SideMenu
      dataTest="axe-indicateurs-panel"
      title="Associer des indicateurs"
      isOpen={openState.isOpen}
      setIsOpen={openState.setIsOpen}
    >
      <LinkIndicateursView
        selectedIndicateurs={selectedIndicateurs || []}
        onSelect={(indicateur) => updateIndicateurs(indicateur)}
      />
    </SideMenu>
  );
};
