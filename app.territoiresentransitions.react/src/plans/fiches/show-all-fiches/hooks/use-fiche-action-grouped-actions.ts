import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useState } from 'react';

export const useFicheActionGroupedActions = () => {
  const [isGroupedActionsOn, setIsGroupedActionsOn] = useState(false);

  const handleGroupedActionsToggle = (checked: boolean) => {
    setIsGroupedActionsOn(checked);
  };

  // Feature flag pour la fonctionnalité "sélectionner tous"
  const selectAllFeatureFlagEnabled = useFeatureFlagEnabled(
    'select-all-fiches-enabled'
  );

  return {
    isGroupedActionsOn,
    handleGroupedActionsToggle,
    selectAllFeatureFlagEnabled,
  };
};
