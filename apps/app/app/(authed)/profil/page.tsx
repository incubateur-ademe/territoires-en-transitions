'use client';

import { makeRejoindreCollectiviteUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { AssistantCard } from '@/app/users/assistant/assistant.card';
import { canUseAssistant } from '@/app/users/assistant/can-use-assistant';
import { LinkOidcIdentityMethods } from '@/app/users/authentications/oidc/link-oidc-identity/link-oidc-identity.methods';
import { ProfilInfo } from '@/app/users/profil/profil-info';
import { ProfilNotifications } from '@/app/users/profil/profil-notifications';
import { useUser } from '@tet/api/users';
import { Button, PageHeader } from '@tet/ui';

export default function Page() {
  const user = useUser();
  const rejoindreCollectiviteUrl = makeRejoindreCollectiviteUrl();

  return (
    <div data-test="MonCompte">
      <PageHeader>
        <PageHeader.Title>{appLabels.preferences}</PageHeader.Title>
        <PageHeader.Actions>
          <Button href={rejoindreCollectiviteUrl} size="sm">
            {appLabels.rejoindreUneCollectivite}
          </Button>
        </PageHeader.Actions>
      </PageHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProfilInfo user={user} />
        <ProfilNotifications />
        <LinkOidcIdentityMethods />
        {canUseAssistant(user) && <AssistantCard />}
      </div>
    </div>
  );
}
