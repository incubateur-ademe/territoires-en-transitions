'use client';

import { useIsNotificationEnabled } from '@/app/plans/fiches/update-fiche/data/use-is-notification-enabled';
import { ProfilInfo } from '@/app/users/profil/profil-info';
import { ProfilNotifications } from '@/app/users/profil/profil-notifications';
import { getRejoindreCollectivitePath } from '@tet/api';
import { useUser } from '@tet/api/users';
import { Button } from '@tet/ui';

export default function Page() {
  const user = useUser();
  const rejoindreCollectivitePath = getRejoindreCollectivitePath(
    document.location.origin
  );
  const isNotificationEnabled = useIsNotificationEnabled();

  return (
    <div data-test="MonCompte">
      <div className="flex flex-wrap items-center justify-between gap-6 mb-12 pb-8 border-b border-primary-3">
        <h1 className="mb-0">Mon compte</h1>
        <Button href={rejoindreCollectivitePath} size="sm">
          Rejoindre une collectivité
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProfilInfo user={user} />
        {isNotificationEnabled && <ProfilNotifications />}
      </div>
    </div>
  );
}
