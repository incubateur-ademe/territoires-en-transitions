'use client';

import { Icon, IconValue } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { ReactNode } from 'react';
import { LabelKey, pluralizeLabel } from '../pluralize';
import { useActionSidePanel } from './context';
import { ActionPanelId } from './types';

const PANEL_CONFIG: Record<
  ActionPanelId,
  { icon: IconValue; label: LabelKey }
> = {
  documents: { icon: 'file-line', label: 'document' },
  indicateurs: { icon: 'line-chart-line', label: 'indicateur' },
  fiches: { icon: 'article-line', label: 'action liée' },
  historique: { icon: 'time-line', label: 'historique' },
  informations: { icon: 'information-line', label: 'informations' },
  comments: { icon: 'discuss-line', label: 'commentaire' },
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
  const displayLabel = pluralizeLabel(count, label);
  const displayText =
    count !== undefined ? `${count} ${displayLabel}` : displayLabel;

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
