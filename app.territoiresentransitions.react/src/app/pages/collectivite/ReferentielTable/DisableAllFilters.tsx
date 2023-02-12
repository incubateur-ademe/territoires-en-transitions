import {MouseEventHandler} from 'react';

export type TDisableAllFiltersProps = {
  filtersCount: number;
  onClick: MouseEventHandler;
};

/**
 * Affiche le bouton "Désactiver tous les filtres des vues tabulaires
 */
export const DisableAllFilters = (props: TDisableAllFiltersProps) => {
  const {onClick, filtersCount} = props;
  if (!filtersCount) {
    return null;
  }

  return (
    <button
      className="fr-link fr-link--icon-left fr-fi-close-circle-fill fr-ml-2w"
      data-test="DisableAllFilters"
      onClick={onClick}
    >
      Désactiver tous les filtres
    </button>
  );
};
