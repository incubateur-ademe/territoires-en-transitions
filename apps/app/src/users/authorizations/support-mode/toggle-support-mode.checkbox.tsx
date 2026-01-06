import { Checkbox } from '@tet/ui';
import { useSupportMode } from './support-mode.provider';

export function ToggleSupportModeCheckbox() {
  const { isSupportModeEnabled, toggleSupportMode, isPending } =
    useSupportMode();

  return (
    <Checkbox
      key="checkbox-support-mode"
      variant="switch"
      label="Mode support"
      checked={isSupportModeEnabled}
      onChange={toggleSupportMode}
      disabled={isPending}
    />
  );
}
