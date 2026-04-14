'use client';

import { ActionId } from '@tet/domain/referentiels';
import { Button, ButtonSize, ButtonVariant, cn, IconValue } from '@tet/ui';
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
  variant = 'grey',
  size = 'xs',
  targetActionId,
}: {
  panelId: ActionPanelId;
  count?: number;
  variant?: ButtonVariant;
  size?: ButtonSize;
  targetActionId?: ActionId;
}): ReactNode {
  const { togglePanel, isActive } = useActionSidePanel();
  const { icon, label } = PANEL_CONFIG[panelId];
  const active = isActive(panelId, targetActionId);
  const displayLabel = pluralizeLabel(count, label);
  const displayText =
    count !== undefined ? `${count} ${displayLabel}` : displayLabel;

  return (
    <Button
      variant={variant}
      size={size}
      icon={icon}
      onClick={() => togglePanel(panelId, targetActionId)}
      aria-pressed={active}
      className={cn(
        // TODO à gérer nativement dans le composant Button en fonction du variant
        active
          ? 'bg-primary-9 hover:!bg-primary-9 text-white hover:!text-white'
          : 'text-grey-8 border-grey-4'
      )}
    >
      {displayText}
    </Button>
  );
}
