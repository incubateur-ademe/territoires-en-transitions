import { Checkbox } from '@tet/ui';
import { useSuperAdminMode } from './super-admin-mode.provider';

export function ToggleSuperAdminModeCheckbox() {
  const { isSuperAdminRoleEnabled, toggleSuperAdminRole, isPending } =
    useSuperAdminMode();

  return (
    <Checkbox
      key="checkbox-super-admin-mode"
      variant="switch"
      label="Mode support"
      checked={isSuperAdminRoleEnabled}
      onChange={toggleSuperAdminRole}
      disabled={isPending}
    />
  );
}
