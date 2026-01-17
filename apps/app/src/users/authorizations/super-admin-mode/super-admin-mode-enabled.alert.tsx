import { Alert } from '@tet/ui';
import { ToggleSuperAdminModeCheckbox } from './toggle-super-admin-mode.checkbox';

export function SuperAdminModeEnabledAlert() {
  return (
    <Alert
      state="error"
      customIcon="alarm-warning-fill"
      title={
        <div className="flex gap-5">
          <ToggleSuperAdminModeCheckbox />
          <span>
            Vous avez des permissions administrateur sur toutes les
            collectivités. Prudence ⛑️
          </span>
        </div>
      }
    />
  );
}
