'use client';

import { appLabels } from '@/app/labels/catalog';
import { useIsNotificationEnabled } from '@/app/plans/fiches/update-fiche/data/use-is-notification-enabled';
import { ProfilInfo } from '@/app/users/profil/profil-info';
import { ProfilNotifications } from '@/app/users/profil/profil-notifications';
import { getRejoindreCollectivitePath } from '@tet/api';
import { useUser } from '@tet/api/users';
import { Button, PageHeader } from '@tet/ui';

export default function Page() {
  const user = useUser();
  const rejoindreCollectivitePath = getRejoindreCollectivitePath(
    document.location.origin
  );
  const isNotificationEnabled = useIsNotificationEnabled();

  return (
    <div data-test="MonCompte">
      <PageHeader>
        <PageHeader.Title>{appLabels.monCompte}</PageHeader.Title>
        <PageHeader.Actions>
          <Button href={rejoindreCollectivitePath} size="sm">
            {appLabels.rejoindreUneCollectivite}
          </Button>
        </PageHeader.Actions>
      </PageHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProfilInfo user={user} />
        {isNotificationEnabled && <ProfilNotifications />}
      </div>
    </div>
  );
}
