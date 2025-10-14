import {
  CurrentCollectivite,
  useCurrentCollectivite,
} from '@/api/collectivites';
import { UserDetails } from '@/api/users/user-details.fetch.server';
import { useUser } from '@/api/users/user-provider';
import { useBaseToast } from '@/app/utils/toast/use-base-toast';
import { PermissionLevel } from '@/domain/users';
import { Modal } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useEffect, useState } from 'react';
import { InviteMemberForm } from './invite-member.form';
import { InvitationData, useCreateInvitation } from './use-create-invitation';
import { SendInvitationData } from './use-invite-member';

type InvitationModalProps = {
  openState: OpenState;
  collectivite: CurrentCollectivite;
  currentUser: UserDetails;
  sendData?: SendInvitationData;
  tagIds?: number[];
};

const InvitationModal = ({
  openState,
  collectivite,
  currentUser,
  sendData,
  tagIds,
}: InvitationModalProps) => {
  const { collectiviteId, nom: collectiviteNom, niveauAcces } = collectivite;

  const [data, setData] = useState<InvitationData>();

  const { mutate: createInvitation } = useCreateInvitation(
    collectiviteId,
    collectiviteNom,
    currentUser,
    (data) => setData(data)
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
      setToast('success', mailSentMessage(collectiviteNom, data.email));
    } else if (data.error) {
      setToast('info', data.error);
    }
  }, [data?.added, data?.error]);

  // affichage de la notification après le renvoi d'une invitation
  useEffect(() => {
    if (sendData?.sent && sendData?.email) {
      setToast('success', mailSentMessage(collectiviteNom, sendData.email));
    } else if (sendData?.error) {
      setToast('error', sendData.error);
    }
  }, [sendData?.sent, sendData?.email, sendData?.error]);

  return (
    <>
      {openState.isOpen && (
        <Modal
          openState={openState}
          title="Inviter un membre"
          size="lg"
          render={({ close }) => (
            <InviteMemberForm
              collectiviteId={collectiviteId}
              niveauAcces={niveauAcces as 'edition' | 'admin'}
              defaultTagIds={tagIds}
              onCancel={close}
              onSubmit={({ email, niveau, tagIds }) => {
                createInvitation({
                  collectiviteId,
                  email: email.toLowerCase(),
                  permissionLevel: niveau as PermissionLevel,
                  tagIds,
                });
                close();
              }}
            />
          )}
        />
      )}
      {renderToast()}
    </>
  );
};

type InvitationModalConnectedProps = {
  openState: OpenState;
  sendData?: SendInvitationData;
  tagIds?: number[];
};

export const InviteMemberModal = (props: InvitationModalConnectedProps) => {
  const user = useUser();
  const collectivite = useCurrentCollectivite();

  if (
    !user?.id ||
    !collectivite.niveauAcces ||
    collectivite.niveauAcces === 'lecture'
  ) {
    return null;
  }

  return (
    <InvitationModal
      currentUser={user}
      collectivite={collectivite}
      {...props}
    />
  );
};

// formate le message affiché après l'envoi d'un email
const mailSentMessage = (collectiviteNom: string, email: string): string =>
  `L'invitation à rejoindre la collectivité ${collectiviteNom} a bien été envoyée à ${email}`;
