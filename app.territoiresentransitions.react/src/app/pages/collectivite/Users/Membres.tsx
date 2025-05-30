import { UserDetails } from '@/api/users/user-details.fetch.server';
import { useUser } from '@/api/users/user-provider';
import InvitationModal from '@/app/app/pages/collectivite/Users/invitation/invitation-modal';
import MembreListTable from '@/app/app/pages/collectivite/Users/membres-liste/MembreListTable';
import TagsListeTable from '@/app/app/pages/collectivite/Users/tags-liste/tags-liste-table';
import { useSendInvitation } from '@/app/app/pages/collectivite/Users/useSendInvitation';

import { useCurrentCollectivite } from '@/api/collectivites';
import { CurrentCollectivite } from '@/api/collectivites/use-get-current-collectivite';
import { Alert, Button, Divider, Tab, Tabs } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import { useState } from 'react';

export type MembresProps = {
  collectivite: CurrentCollectivite;
  currentUser: UserDetails;
};

/**
 * Affiche la page listant les utilisateurs attachés à une collectivité
 * et le formulaire permettant d'envoyer des liens d'invitation
 */
export const Membres = ({ collectivite, currentUser }: MembresProps) => {
  const { collectiviteId, nom: collectiviteNom, niveauAcces } = collectivite;
  const canInvite = niveauAcces === 'admin' || niveauAcces === 'edition';

  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data: sendData, mutate: sendInvitation } = useSendInvitation(
    collectiviteId,
    collectiviteNom,
    currentUser
  );

  return (
    <>
      <PageContainer dataTest="Users" containerClassName="grow">
        <div className="flex max-md:flex-col gap-y-4 justify-between md:items-center mb-4">
          <h1 className="mb-0 max-md:order-2">Gestion des utilisateurs</h1>

          {canInvite && (
            <Button
              data-test="invite"
              size="sm"
              className="h-fit"
              onClick={() => setIsInviteOpen(true)}
            >
              Inviter un membre
            </Button>
          )}
        </div>

        <Divider />

        <Tabs tabsListClassName="!justify-start flex-nowrap overflow-x-auto">
          <Tab
            label="Informations utilisateurs"
            icon="team-line"
            iconClassName="text-primary-7 mr-2"
          >
            <div className="bg-white rounded-lg border border-grey-3 p-7">
              <MembreListTable
                collectiviteId={collectiviteId}
                currentUserId={currentUser.id}
                currentUserAccess={niveauAcces ?? 'lecture'}
                sendInvitation={sendInvitation}
              />
            </div>
          </Tab>

          <Tab
            label="Tags pilotes"
            icon="account-circle-line"
            iconClassName="text-primary-7 mr-2"
          >
            <Alert
              rounded
              state="info"
              description="Dans cette vue, apparaissent uniquement les tags pilotes qui n’ont pas déjà été associés à des comptes utilisateurs. Si vous souhaitez modifier les informations d’un utilisateur, cela se fait dans l’onglet Informations utilisateurs."
              className="mb-4"
            />
            <div className="bg-white rounded-lg border border-grey-3 p-7">
              <TagsListeTable
                collectiviteId={collectiviteId}
                currentUserAccess={niveauAcces ?? 'lecture'}
                sendData={sendData}
                sendInvitation={sendInvitation}
              />
            </div>
          </Tab>
        </Tabs>

        <InvitationModal
          openState={{ isOpen: isInviteOpen, setIsOpen: setIsInviteOpen }}
          sendData={sendData}
        />
      </PageContainer>
    </>
  );
};

const MembresConnected = () => {
  const user = useUser();
  const collectivite = useCurrentCollectivite();

  if (!user?.id || !collectivite.collectiviteId) return null;

  return <Membres currentUser={user} collectivite={collectivite} />;
};

export default MembresConnected;
