import { useState } from 'react';

export const useFicheActionGroupedActions = () => {
  const [isGroupedActionsOn, setIsGroupedActionsOn] = useState(false);

  const handleGroupedActionsToggle = (checked: boolean) => {
    setIsGroupedActionsOn(checked);
  };

  return {
    isGroupedActionsOn,
    handleGroupedActionsToggle,
  };
};
