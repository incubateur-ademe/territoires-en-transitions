import { UserDetails } from '@/api/users/user-details.fetch.server';
import { Invite } from '@/app/app/pages/collectivite/Users/components/Invite';
import {
  InvitationData,
  useCreateInvitation,
} from '@/app/app/pages/collectivite/Users/invitation/use-create-invitation';
import { SendInvitationData } from '@/app/app/pages/collectivite/Users/useSendInvitation';
import { useBaseToast } from '@/app/core-logic/hooks/useBaseToast';
import { CurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { TNiveauAcces } from '@/app/types/alias';
import { PermissionLevel } from '@/backend/auth/authorizations/roles/niveau-acces.enum';
import { Modal } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useEffect, useState } from 'react';

type InvitationModalProps = {
  openState: OpenState;
  collectivite: CurrentCollectivite;
  currentUser: UserDetails;
  niveauAcces: TNiveauAcces;
  sendData?: SendInvitationData;
  tagIds?: number[];
};

const InvitationModal = ({
  openState,
  collectivite,
  currentUser,
  niveauAcces,
  sendData,
  tagIds,
}: InvitationModalProps) => {
  if (niveauAcces === 'lecture') return null;

  const [data, setData] = useState<InvitationData>();

  const { mutate: createInvitation } = useCreateInvitation(
    collectivite,
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
      setToast('success', mailSentMessage(collectivite, data.email));
    } else if (data.error) {
      setToast('info', data.error);
    }
  }, [data?.added, data?.error]);

  // affichage de la notification après le renvoi d'une invitation
  useEffect(() => {
    if (sendData?.sent && sendData?.email) {
      setToast('success', mailSentMessage(collectivite, sendData.email));
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
            <Invite
              collectiviteId={collectivite.collectiviteId}
              niveauAcces={niveauAcces}
              defaultTagIds={tagIds}
              onCancel={close}
              onSubmit={({ email, niveau, tagIds }) => {
                createInvitation({
                  collectiviteId: collectivite.collectiviteId,
                  email: email.toLowerCase(),
                  niveau: niveau as PermissionLevel,
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

export default InvitationModal;

// formate le message affiché après l'envoi d'un email
const mailSentMessage = (
  collectivite: CurrentCollectivite,
  email: string
): string =>
  `L'invitation à rejoindre la collectivité ${collectivite.nom} a bien été envoyée à ${email}`;
