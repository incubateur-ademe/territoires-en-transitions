import { LinkIndicateursViewBase } from '@/app/plans/fiches/show-fiche/content/indicateurs/side-menu/link-indicateur.view';
import { SideMenu } from '@tet/ui';
import { useAxeContext } from './axe.context';

export const AxeIndicateursPanel = () => {
  const {
    isOpenPanelIndicateurs,
    setIsOpenPanelIndicateurs,
    selectedIndicateurs,
    toggleIndicateur,
    isReadOnly,
  } = useAxeContext();

  if (isReadOnly) {
    return;
  }

  return (
    <SideMenu
      dataTest="axe-indicateurs-panel"
      title="Associer des indicateurs"
      isOpen={isOpenPanelIndicateurs}
      setIsOpen={setIsOpenPanelIndicateurs}
    >
      <LinkIndicateursViewBase
        indicateurs={{
          list: selectedIndicateurs || [],
          update: (indicateur) => toggleIndicateur(indicateur),
        }}
      />
    </SideMenu>
  );
};
