import { appLabels } from '@/app/labels/catalog';
import { Alert, useOnlineStatus } from '@tet/ui';

export const OfflineAlert = () => {
  const isOnline = useOnlineStatus();

  return (
    !isOnline && (
      <div className="sticky top-0 z-tooltip">
        <Alert
          state="error"
          customIcon="cloud-off-line"
          title={appLabels.erreurConnexionReseau}
        />
      </div>
    )
  );
};
