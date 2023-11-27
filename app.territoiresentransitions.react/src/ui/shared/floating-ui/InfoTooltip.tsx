import {ReactElement} from 'react';
import DSTetTooltip from './DSTetTooltip';

/** Affiche un picto (i) permettant d'ouvrir une infobulle au clic */
export const InfoTooltip = ({
  label,
  className,
}: {
  label: string | (() => ReactElement);
  className?: string;
}) => (
  <span onClick={evt => evt.stopPropagation()} className={className}>
    <DSTetTooltip label={label} activatedBy="click">
      <span className="fr-fi-information-line pl-2 text-bf500 cursor-pointer" />
    </DSTetTooltip>
  </span>
);
