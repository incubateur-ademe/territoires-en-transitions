import {useState} from 'react';
import {CarteActionImpact} from './CarteActionImpact';
import {ModaleActionImpact} from './ModaleActionImpact';
import {ActionImpactProps} from './types';

/**
 * Action à impact du panier d'actions (carte + modale)
 */

export const ActionImpact = ({
  isSelected,
  onToggleSelected,
  ...props
}: ActionImpactProps) => {
  const [isActionSelected, setIsActionSelected] = useState(isSelected ?? false);

  const handleToggleSelect = value => {
    setIsActionSelected(value);
    onToggleSelected(value);
  };

  return (
    <ModaleActionImpact
      isSelected={isActionSelected}
      onToggleSelected={handleToggleSelect}
      {...props}
    >
      <div>
        <CarteActionImpact
          isSelected={isActionSelected}
          onToggleSelected={handleToggleSelect}
          {...props}
        />
      </div>
    </ModaleActionImpact>
  );
};
