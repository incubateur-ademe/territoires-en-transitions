import {MouseEventHandler} from 'react';
import AnchorAsButton from './AnchorAsButton';

export type TDisableAllFiltersProps = {
  filtersCount: number;
  onClick: MouseEventHandler;
  label?: string;
};

/**
 * Affiche le bouton "Désactiver tous les filtres des vues tabulaires
 */
export const DisableAllFilters = (props: TDisableAllFiltersProps) => {
  const {onClick, filtersCount, label = 'Désactiver tous les filtres'} = props;
  if (!filtersCount) {
    return null;
  }

  return (
    <AnchorAsButton
      className="underline_href fr-link fr-link--icon-left fr-icon-close-circle-fill fr-ml-2w fr-pl-1v"
      data-test="DisableAllFilters"
      onClick={onClick}
    >
      {label}
    </AnchorAsButton>
  );
};
