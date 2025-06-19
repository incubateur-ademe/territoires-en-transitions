import { fetchCurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { createClient } from '@/api/utils/supabase/server-client';
import PageContainer from '@/ui/components/layout/page-container';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { ReactNode } from 'react';
import { z } from 'zod';
import { InviteMemberButton } from './_components/invite-member.button';

/**
 * Affiche les onglets de gestion des membres
 */
export default async function Layout({
  tabs,
  params,
}: {
  tabs: ReactNode;
  params: Promise<{ collectiviteId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId } = await params;
  const collectiviteId = z.coerce.number().parse(unsafeCollectiviteId);

  const supabase = await createClient();
  const collectivite = await fetchCurrentCollectivite(supabase, collectiviteId);

  const canInvite =
    collectivite?.niveauAcces === 'admin' ||
    collectivite?.niveauAcces === 'edition';

  return (
    <PageContainer dataTest="Users" containerClassName="grow">
      <div className="flex max-md:flex-col gap-y-4 justify-between md:items-center mb-4">
        <h1 className="mb-0 max-md:order-2">Gestion des utilisateurs</h1>
        <VisibleWhen condition={canInvite}>
          <InviteMemberButton />
        </VisibleWhen>
      </div>

      {tabs}

      {/*
      <Divider />
      <Tabs tabsListClassName="!justify-start pl-0 mt-6 flex-nowrap">
        <TabsList>
          <TabsTab
            href={makeCollectiviteUsersUrl({ collectiviteId })}
            label="Informations utilisateurs"
            icon="team-line"
            iconClassName="text-primary-7 mr-2"
          />
          <TabsTab
            href={makeCollectiviteUsersTagsUrl({ collectiviteId })}
            label="Tags pilotes"
            icon="account-circle-line"
            iconClassName="text-primary-7 mr-2"
          />
        </TabsList>
        <TabsPanel removeContainer>{tabs}</TabsPanel>
      </Tabs> */}
    </PageContainer>
  );
}
