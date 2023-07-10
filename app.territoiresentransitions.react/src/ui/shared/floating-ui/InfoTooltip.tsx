import {ReactElement} from 'react';
import {Tooltip} from './Tooltip';

/** Affiche un picto (i) permettant d'ouvrir une infobulle au clic */
export const InfoTooltip = ({
  label,
}: {
  label: string | (() => ReactElement);
}) => (
  <span onClick={evt => evt.stopPropagation()}>
    <Tooltip label={label} activatedBy="click">
      <span className="fr-fi-information-line pl-2 text-bf500 cursor-pointer" />
    </Tooltip>
  </span>
);
