import {useEffect, useState} from 'react';
import {ActionImpactProps} from './types';
import {ModaleActionImpact} from './ModaleActionImpact';
import {CarteActionImpact} from './CarteActionImpact';

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

  const handleToggleSelect = (value: boolean) => {
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
