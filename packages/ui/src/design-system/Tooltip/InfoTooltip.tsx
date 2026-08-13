import classNames from 'classnames';
import { Icon, IconSize } from '../Icon';
import { Tooltip, TooltipProps } from './Tooltip';

type InfoTooltipProps = Omit<TooltipProps, 'children'> & {
  size?: IconSize;
  iconClassName?: string;
  /** Nom accessible du déclencheur. */
  ariaLabel?: string;
};

/**
 * Icône info associée à une tooltip.
 *
 * Le déclencheur est un bouton et non une simple icône : `Tooltip` branche
 * `useFocus`, mais une icône n'entre pas dans l'ordre de tabulation — l'aide
 * n'était donc atteignable ni au clavier ni au tactile.
 */
export const InfoTooltip = ({
  size = 'sm',
  iconClassName,
  ariaLabel = 'Aide',
  ...tooltipProps
}: InfoTooltipProps) => {
  return (
    <Tooltip {...tooltipProps}>
      <button
        type="button"
        aria-label={ariaLabel}
        className="inline-flex cursor-pointer align-middle"
        onClick={(evt) => evt.stopPropagation()}
      >
        <Icon
          icon="information-line"
          size={size}
          className={classNames('text-grey-8', iconClassName)}
        />
      </button>
    </Tooltip>
  );
};
