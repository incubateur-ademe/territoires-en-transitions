import { appLabels } from '@/app/labels/catalog';
import { ActionId } from '@tet/domain/referentiels';
import { Button, ButtonSize, ButtonVariant, IconValue } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { ReactNode } from 'react';
import { useActionSidePanel } from './context';
import { ActionPanelId } from './types';

type PanelLabel = string | ((params: { count: number }) => string);

const PANEL_CONFIG: Record<
  ActionPanelId,
  { icon: IconValue; label: PanelLabel }
> = {
  documents: { icon: 'file-line', label: appLabels.document },
  indicateurs: { icon: 'line-chart-line', label: appLabels.indicateur },
  fiches: { icon: 'article-line', label: appLabels.actionLiee },
  historique: { icon: 'time-line', label: appLabels.panneauHistorique },
  informations: {
    icon: 'information-line',
    label: appLabels.panneauInformations,
  },
  comments: { icon: 'discuss-line', label: appLabels.commentaires },
};

export type SidePanelButtonProps = {
  panelId: ActionPanelId;
  count?: number;
  variant?: ButtonVariant;
  size?: ButtonSize;
  targetActionId?: ActionId;
  beforeToggle?: () => void;
};

export function SidePanelButton({
  panelId,
  count,
  variant = 'grey',
  size = 'xs',
  targetActionId,
  beforeToggle,
}: SidePanelButtonProps): ReactNode {
  const { togglePanel, isActive } = useActionSidePanel();
  const { icon, label } = PANEL_CONFIG[panelId];
  const active = isActive(panelId, targetActionId);
  const displayText =
    typeof label === 'function' ? label({ count: count ?? 0 }) : label;

  return (
    <Button
      variant={variant}
      size={size}
      icon={icon}
      onClick={() => {
        if (!active && beforeToggle) {
          beforeToggle();
        }
        togglePanel(panelId, targetActionId);
      }}
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
