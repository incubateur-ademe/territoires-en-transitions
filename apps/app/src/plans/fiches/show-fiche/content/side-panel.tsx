import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { useEffect } from 'react';
import { useFicheContext } from '../context/fiche-context';
import { LinkIndicateursView } from './indicateurs/side-menu/link-indicateur.view';

export const SidePanel = () => {
  const { indicateurAction, selectedIndicateurs, updateIndicateurs } =
    useFicheContext();
  const { setPanel } = useSidePanel();

  useEffect(() => {
    if (indicateurAction === 'associating') {
      setPanel({
        type: 'open',
        title: 'Lier des indicateurs',
        content: (
          <LinkIndicateursView
            selectedIndicateurs={selectedIndicateurs}
            onSelect={(indicateur) => updateIndicateurs(indicateur)}
          />
        ),
      });
    }
    if (indicateurAction === 'none') {
      setPanel({ type: 'close' });
    }
  }, [indicateurAction, setPanel, selectedIndicateurs, updateIndicateurs]);

  return null;
};
