import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { FicheWithRelations } from '@tet/domain/plans';
import { useCallback, useState } from 'react';
import { SIDE_PANEL_CONFIG, SidePanelAction } from './side-panel.config';

export const useFicheSidePanel = () => {
  const { setPanel, panel } = useSidePanel();
  const [derniereAction, setDerniereAction] = useState<SidePanelAction>('none');

  /**
   * L'action courante se déduit de l'état du panneau : fermé, il n'y a pas
   * d'action. Un effet la remettait à 'none' après coup, ce qui laissait le
   * temps d'un rendu une action active sur un panneau déjà fermé.
   */
  const currentAction: SidePanelAction = panel.isOpen ? derniereAction : 'none';

  const openPanel = useCallback(
    (action: Exclude<SidePanelAction, 'none'>, fiche: FicheWithRelations) => {
      const nextAction = currentAction === action ? 'none' : action;

      if (nextAction === 'none') {
        setDerniereAction('none');
        setPanel({ type: 'close' });
        return;
      }
      const config = SIDE_PANEL_CONFIG[nextAction];
      setDerniereAction(nextAction);

      setPanel({
        type: 'open',
        title: config.title,
        content: config.content(fiche),
      });
    },
    [currentAction, setPanel]
  );

  return { openPanel };
};
