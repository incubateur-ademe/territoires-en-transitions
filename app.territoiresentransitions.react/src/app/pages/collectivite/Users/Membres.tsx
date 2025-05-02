import { UserDetails } from '@/api/users/user-details.fetch.server';
import { useUser } from '@/api/users/user-provider';
import { Invite } from '@/app/app/pages/collectivite/Users/components/Invite';
import MembreListTable from '@/app/app/pages/collectivite/Users/membres-liste/MembreListTable';
import { useAddUserToCollectivite } from '@/app/app/pages/collectivite/Users/useAddUserToCollectivite';
import { useSendInvitation } from '@/app/app/pages/collectivite/Users/useSendInvitation';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useBaseToast } from '@/app/core-logic/hooks/useBaseToast';
import {
  CurrentCollectivite,
  useCurrentCollectivite,
} from '@/app/core-logic/hooks/useCurrentCollectivite';
import { TNiveauAcces } from '@/app/types/alias';
import { Button, Divider, Modal } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import { useEffect } from 'react';

export type MembresProps = {
  collectivite: CurrentCollectivite;
  currentUser: UserDetails;
  niveauAcces?: TNiveauAcces;
};

/**
 * Affiche la page listant les utilisateurs attachés à une collectivité
 * et le formulaire permettant d'envoyer des liens d'invitation
 */
export const Membres = ({
  collectivite,
  currentUser,
  niveauAcces = 'lecture',
}: MembresProps) => {
  const canInvite = niveauAcces === 'admin' || niveauAcces === 'edition';

  const { data, mutate: addUser } = useAddUserToCollectivite(
    collectivite,
    currentUser
  );
  const { data: sendData, mutate: sendInvitation } = useSendInvitation(
    collectivite,
    currentUser
  );

  const { setToast, renderToast } = useBaseToast();

  // affichage des notifications après l'ajout ou l'envoi de l'invitation
  useEffect(() => {
    if (!data) return;
    if (data.added) {
      setToast(
        'success',
        'Nouveau membre ajouté avec succès à la collectivité !'
      );
    } else if (data.invitationId) {
      setToast('success', mailSentMessage(collectivite, data));
    } else if (data.error) {
      setToast('info', data.error);
    }
  }, [data?.added, data?.error]);

  // affichage de la notification après le renvoi d'une invitation
  useEffect(() => {
    if (sendData?.sent) {
      setToast('success', mailSentMessage(collectivite, sendData));
    } else if (sendData?.error) {
      setToast('error', sendData.error);
    }
  }, [sendData?.sent, sendData?.email, sendData?.error]);

  return (
    <>
      <PageContainer dataTest="Users" containerClassName="grow">
        <div className="flex max-md:flex-col gap-y-4 justify-between md:items-center mb-4">
          <h1 className="mb-0 max-md:order-2">Gestion des utilisateurs</h1>

          {canInvite && (
            <Modal
              title="Inviter un membre"
              render={({ close }) => (
                <Invite
                  niveauAcces={niveauAcces}
                  onCancel={close}
                  onSubmit={(data) => {
                    addUser(data);
                    close();
                  }}
                />
              )}
            >
              <Button data-test="invite" size="sm" className="h-fit">
                Inviter un membre
              </Button>
            </Modal>
          )}
        </div>

        <Divider />
        {/*
        <Tabs tabsListClassName="!justify-start flex-nowrap overflow-x-auto">
          <Tab
            label="Informations utilisateurs"
            icon="team-line"
            iconClassName="text-primary-7 mr-2"
          >
            <div className="bg-white rounded-lg border border-grey-3 p-7">
              <MembreListTable
              currentUserId={currentUser.id}
              currentUserAccess={niveauAcces}
              sendInvitation={sendInvitation}
          />
            </div>
          </Tab>

          <Tab
            label="Tags pilotes"
            icon="account-circle-line"
            iconClassName="text-primary-7 mr-2"
          >
            Tags
          </Tab>
        </Tabs> */}

        <div className="bg-white rounded-lg border border-grey-3 p-7">
          <MembreListTable
            currentUserId={currentUser.id}
            currentUserAccess={niveauAcces}
            sendInvitation={sendInvitation}
          />
        </div>

        {renderToast()}
      </PageContainer>
    </>
  );
};

// formate le message affiché après l'envoi d'un email
const mailSentMessage = (
  collectivite: CurrentCollectivite,
  data: { email: string }
): string =>
  `L'invitation à rejoindre la collectivité ${collectivite.nom} a bien été envoyée à ${data.email}`;

const MembresConnected = () => {
  const user = useUser();
  const collectivite_id = useCollectiviteId();
  const collectivite = useCurrentCollectivite();

  if (!user?.id || !collectivite_id || !collectivite) return null;

  return (
    <Membres
      currentUser={user}
      collectivite={collectivite}
      niveauAcces={collectivite.niveauAcces ?? undefined}
    />
  );
};

export default MembresConnected;
