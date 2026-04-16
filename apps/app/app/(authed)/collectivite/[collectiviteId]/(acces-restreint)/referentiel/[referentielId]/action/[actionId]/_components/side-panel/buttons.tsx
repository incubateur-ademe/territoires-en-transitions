'use client';

import { appLabels } from '@/app/labels/catalog';
import { Icon, IconValue } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { ReactNode } from 'react';
import { useActionSidePanel } from './context';
import { ActionPanelId } from './types';

type PanelLabel = string | ((params: { count: number }) => string);

const PANEL_CONFIG: Record<ActionPanelId, { icon: IconValue; label: PanelLabel }> = {
  documents: { icon: 'file-line', label: appLabels.document },
  indicateurs: { icon: 'line-chart-line', label: appLabels.indicateur },
  fiches: { icon: 'article-line', label: appLabels.actionLiee },
  historique: { icon: 'time-line', label: appLabels.panneauHistorique },
  informations: { icon: 'information-line', label: appLabels.panneauInformations },
  comments: { icon: 'discuss-line', label: appLabels.commentaires },
};

export function SidePanelButton({
  panelId,
  count,
}: {
  panelId: ActionPanelId;
  count?: number;
}): ReactNode {
  const { togglePanel, isActive } = useActionSidePanel();
  const { icon, label } = PANEL_CONFIG[panelId];
  const active = isActive(panelId);
  const displayText =
    typeof label === 'function' ? label({ count: count ?? 0 }) : label;

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => togglePanel(panelId)}
      className={cn(
        'flex items-center gap-1 text-sm leading-6 font-normal cursor-pointer rounded-md px-2 py-1 -mx-2 -my-1',
        'text-primary-9 hover:bg-grey-3',
        active && 'font-bold'
      )}
    >
      <Icon icon={icon} size="sm" />
      {displayText}
    </button>
  );
}
