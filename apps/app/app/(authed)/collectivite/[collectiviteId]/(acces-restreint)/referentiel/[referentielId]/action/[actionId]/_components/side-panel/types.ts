import { createEnumObject } from '@tet/domain/utils';

export const ACTION_PANEL_IDS = [
  'comments',
  'documents',
  'indicateurs',
  'fiches',
  'historique',
  'informations',
] as const;

export type ActionPanelId = (typeof ACTION_PANEL_IDS)[number];
export const ActionPanelIdEnum = createEnumObject(ACTION_PANEL_IDS);

export type ActivePanel = {
  panelId: ActionPanelId;
  targetActionId?: string;
};

export type ActionSidePanelContextType = {
  togglePanel: (panelId: ActionPanelId, targetActionId?: string) => void;
  isActive: (panelId: ActionPanelId, targetActionId?: string) => boolean;
};
