import { Alert, useOnlineStatus } from '@tet/ui';

export const OfflineAlert = () => {
  const isOnline = useOnlineStatus();

  return (
    !isOnline && (
      <div className="sticky top-0 z-tooltip">
        <Alert
          state="error"
          customIcon="cloud-off-line"
          title="Erreur de connexion réseau. Veuillez attendre que votre connexion soit rétablie pour utiliser l'application."
        />
      </div>
    )
  );
};
