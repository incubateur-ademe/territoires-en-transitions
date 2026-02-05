'use client';

import { getRejoindreCollectivitePath } from '@tet/api';
import { useUser } from '@tet/api/users';
import { Button } from '@tet/ui';
import { ProfilInfo } from './_components/profil-info';

export default function Page() {
  const user = useUser();
  const rejoindreCollectivitePath = getRejoindreCollectivitePath(
    document.location.origin
  );

  return (
    <div data-test="MonCompte">
      <div className="flex flex-wrap items-center justify-between gap-6 mb-12 pb-8 border-b border-primary-3">
        <h1 className="mb-0">Mon compte</h1>
        <Button href={rejoindreCollectivitePath} size="sm">
          Rejoindre une collectivité
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ProfilInfo user={user} />
      </div>
    </div>
  );
}
