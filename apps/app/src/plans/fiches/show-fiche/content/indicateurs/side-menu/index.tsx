import { SideMenu } from '@tet/ui';
import { useFicheContext } from '../../../context/fiche-context';
import { LinkIndicateursView } from './link-indicateur.view';

export const IndicateursSideMenu = () => {
  const { indicateurs } = useFicheContext();
  return (
    <SideMenu
      title="Lier des indicateurs"
      isOpen={indicateurs.action === 'associating'}
      setIsOpen={() => indicateurs.toggleAction('associating')}
    >
      <LinkIndicateursView
        selectedIndicateurs={indicateurs.list}
        onSelect={(indicateur) => indicateurs.update(indicateur)}
      />
    </SideMenu>
  );
};
