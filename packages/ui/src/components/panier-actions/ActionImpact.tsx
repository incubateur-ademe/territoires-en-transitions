import {useEffect, useState} from 'react';
import {CarteActionImpact} from './CarteActionImpact';
import {ModaleActionImpact} from './ModaleActionImpact';
import {ActionImpactProps} from './types';

/**
 * Action à impact du panier d'actions (carte + modale)
 */

export const ActionImpact = ({
  panier,
  onToggleSelected,
  ...props
}: ActionImpactProps) => {
  const [isActionSelected, setIsActionSelected] = useState(panier);

  useEffect(() => setIsActionSelected(panier), [panier]);

  const handleToggleSelect = value => {
    setIsActionSelected(value);
    onToggleSelected(value);
  };

  return (
    <ModaleActionImpact
      panier={isActionSelected}
      onToggleSelected={handleToggleSelect}
      {...props}
    >
      <div>
        <CarteActionImpact
          isSelected={isActionSelected}
          panier={isActionSelected}
          onToggleSelected={handleToggleSelect}
          {...props}
        />
      </div>
    </ModaleActionImpact>
  );
};
