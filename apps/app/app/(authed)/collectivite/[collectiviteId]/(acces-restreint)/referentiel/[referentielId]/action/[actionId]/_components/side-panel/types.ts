export const ACTION_PANEL_IDS = [
  'comments',
  'documents',
  'indicateurs',
  'fiches',
  'historique',
  'informations',
] as const;

export type ActionPanelId = (typeof ACTION_PANEL_IDS)[number];

export type ActivePanel = {
  panelId: ActionPanelId;
  targetActionId?: string;
};

export type ActionSidePanelContextType = {
  togglePanel: (panelId: ActionPanelId, targetActionId?: string) => void;
  isActive: (panelId: ActionPanelId, targetActionId?: string) => boolean;
};
