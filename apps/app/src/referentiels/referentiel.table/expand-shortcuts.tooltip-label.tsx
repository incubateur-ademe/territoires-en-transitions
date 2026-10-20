import { appLabels } from '@/app/labels/catalog';
import { Kbd } from '@/app/ui/shared/Kbd';

/**
 * Contenu de l'infobulle décrivant les raccourcis pour plier/déplier
 * les lignes d'un même niveau
 */
export const ExpandShortcutsTooltipLabel = ({
  isExpanded,
}: {
  isExpanded: boolean;
}) =>
  isExpanded ? (
    <p className="font-normal">
      {appLabels.tooltipReplierLignesDebut} <Kbd>{appLabels.toucheShift}</Kbd>{' '}
      {appLabels.tooltipMaintienEnfonce}
      <br />
      {appLabels.tooltipReplierLignesFin}
    </p>
  ) : (
    <p className="font-normal">
      {appLabels.tooltipDeplierLignesDebut} <Kbd>{appLabels.toucheShift}</Kbd>{' '}
      {appLabels.tooltipMaintienEnfoncePourDeplier}
      <br />
      {appLabels.tooltipDeplierMemeAxe}
      <br />
      <Kbd>{appLabels.toucheAlt}</Kbd> {appLabels.tooltipDeplierTousAxes}
    </p>
  );
