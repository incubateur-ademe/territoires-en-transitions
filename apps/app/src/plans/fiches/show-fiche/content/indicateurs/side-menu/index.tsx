import { SideMenu } from '@tet/ui';
import { useFicheContext } from '../../../context/fiche-context';
import { LinkIndicateursView } from './link-indicateur.view';

export const IndicateursSideMenu = () => {
  const {
    indicateurAction,
    toggleIndicateurAction,
    selectedIndicateurs,
    updateIndicateurs,
  } = useFicheContext();
  return (
    <SideMenu
      title="Lier des indicateurs"
      isOpen={indicateurAction === 'associating'}
      setIsOpen={() => toggleIndicateurAction('associating')}
    >
      <LinkIndicateursView
        selectedIndicateurs={selectedIndicateurs}
        onSelect={(indicateur) => updateIndicateurs(indicateur)}
      />
    </SideMenu>
  );
};
