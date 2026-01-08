import { Alert } from '@tet/ui';
import { ToggleSupportModeCheckbox } from './toggle-support-mode.checkbox';

export function SupportModeEnabledAlert() {
  return (
    <Alert
      state="error"
      customIcon="alert-line"
      title={
        <div className="flex gap-5">
          <span>
            Mode support actif. Vous avez des permissions administrateur sur
            toutes les collectivités.
          </span>
          <ToggleSupportModeCheckbox />
        </div>
      }
    />
  );
}
