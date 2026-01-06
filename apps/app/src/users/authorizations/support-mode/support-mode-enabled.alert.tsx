import { Alert } from '@tet/ui';
import { ToggleSupportModeCheckbox } from './toggle-support-mode.checkbox';

export function SupportModeEnabledAlert() {
  return (
    <Alert
      state="error"
      customIcon="alarm-warning-fill"
      title={
        <div className="flex gap-5">
          <ToggleSupportModeCheckbox />
          <span>
            Vous avez des permissions administrateur sur toutes les
            collectivités. Agissez avec précaution.
          </span>
        </div>
      }
    />
  );
}
