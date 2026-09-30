import type { ReactNode } from 'react';

export type SidePanelTitleProps = {
  title?: string;
};

export type Panel = {
  isPersistentWithNextPath?: (path: string) => boolean;
  title?: string;
  content?: ReactNode;
};

export type PanelAction =
  | ({
      type: 'open';
    } & Panel)
  | { type: 'close' }
  /**
   * Changement de route : ferme le panneau, sauf s'il se déclare persistant
   * pour le chemin atteint. Le tri se fait au dispatch, pas dans le reducer —
   * voir `isPersistentRef`.
   */
  | { type: 'closeOnRouteChange'; path: string }
  | { type: 'setTitle'; title: string };

export type PanelState = Panel & {
  isOpen: boolean;
};

export type CloseRequestOutcome = 'close' | 'stay-open';

export type UseSidePanelOptions = {
  onClose?: () => void;
  onCloseRequest?: () => CloseRequestOutcome;
};

export type UseSidePanelReturn = {
  panel: PanelState;
  setPanel: (action: PanelAction) => void;
  setTitle: (title: string) => void;
};

export type UseSidePanel = (
  options?: UseSidePanelOptions
) => UseSidePanelReturn;
