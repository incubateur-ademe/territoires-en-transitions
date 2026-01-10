import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { FicheWithRelations } from '@tet/domain/plans';
import { useCallback, useEffect, useState } from 'react';
import { SIDE_PANEL_CONFIG, SidePanelAction } from './side-panel.config';

export const useFicheSidePanel = () => {
  const { setPanel, panel } = useSidePanel();
  const [currentAction, setCurrentAction] = useState<SidePanelAction>('none');

  useEffect(() => {
    const isPanelClosed = !panel.isOpen;
    /**
     * To keep the current action in sync with the panel state
     */
    if (isPanelClosed && currentAction !== 'none') {
      setCurrentAction('none');
    }
  }, [panel.isOpen, currentAction]);

  const openPanel = useCallback(
    (action: Exclude<SidePanelAction, 'none'>, fiche: FicheWithRelations) => {
      const nextAction = currentAction === action ? 'none' : action;

      if (nextAction === 'none') {
        setCurrentAction('none');
        setPanel({ type: 'close' });
        return;
      }
      const config = SIDE_PANEL_CONFIG[nextAction];
      setCurrentAction(nextAction);

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
