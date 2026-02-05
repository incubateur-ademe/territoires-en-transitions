import {
  useUpdateUserPreferences,
  useUserPreferences,
} from '@/app/users/use-user-preferences';
import { Checkbox } from '@tet/ui';

export const ProfilNotifications = () => {
  const { data: preferences } = useUserPreferences();
  const { mutate: updatePreferences } = useUpdateUserPreferences();
  if (!preferences) {
    return null;
  }

  const { isNotifyPiloteActionEnabled, isNotifyPiloteSousActionEnabled } =
    preferences.utils.notifications;

  return (
    <div className="flex flex-col gap-6 max-w-xl p-8 font-medium rounded-xl border border-grey-3 bg-white">
      <div className="flex flex-wrap justify-between items-center gap-6">
        <span className="text-lg font-bold">Notifications par email</span>
      </div>
      <div className="h-px w-full bg-grey-3" />
      <div className="flex flex-col gap-4">
        <Checkbox
          variant="switch"
          label="M'alerter par email quand on m'assigne une action"
          containerClassname="flex-row-reverse justify-between"
          checked={isNotifyPiloteActionEnabled}
          onChange={() =>
            updatePreferences({
              'utils.notifications.isNotifyPiloteActionEnabled':
                !isNotifyPiloteActionEnabled,
            })
          }
        />
        <Checkbox
          variant="switch"
          label="M'alerter par email quand on m'assigne une sous-action"
          containerClassname="flex-row-reverse justify-between"
          checked={isNotifyPiloteSousActionEnabled}
          onChange={() =>
            updatePreferences({
              'utils.notifications.isNotifyPiloteSousActionEnabled':
                !isNotifyPiloteSousActionEnabled,
            })
          }
        />
      </div>
    </div>
  );
};
