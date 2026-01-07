import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { useEffect } from 'react';
import { useFicheContext } from '../context/fiche-context';
import { LinkIndicateursView } from './indicateurs/side-menu/link-indicateur.view';

export const SidePanel = () => {
  const { indicateurs } = useFicheContext();
  const { setPanel } = useSidePanel();

  useEffect(() => {
    if (indicateurs.action === 'associating') {
      setPanel({
        type: 'open',
        title: 'Lier des indicateurs',
        content: (
          <LinkIndicateursView
            selectedIndicateurs={indicateurs.list}
            onSelect={(indicateur) => indicateurs.update(indicateur)}
          />
        ),
      });
    }
    if (indicateurs.action === 'none') {
      setPanel({ type: 'close' });
    }
  }, [setPanel, indicateurs.action]);

  return null;
};
