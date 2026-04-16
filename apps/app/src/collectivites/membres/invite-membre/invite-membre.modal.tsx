import { appLabels } from '@/app/labels/catalog';
import { Modal } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { InviteMembreForm } from './invite-membre.form';
import { useInviteMembre } from './use-invite-membre';

type InvitationModalProps = {
  openState: OpenState;
  tagIds?: number[];
};

const InviteMembreModal = ({ openState, tagIds }: InvitationModalProps) => {
  const { mutate: createInvitation } = useInviteMembre();

  return (
    <>
      {openState.isOpen && (
        <Modal
          openState={openState}
          title={appLabels.inviterMembre}
          size="lg"
          render={({ close }) => (
            <InviteMembreForm
              defaultTagIds={tagIds}
              onCancel={close}
              onSubmit={({ email, niveau, tagIds }) => {
                createInvitation({
                  email: email.toLowerCase(),
                  role: niveau,
                  tagIds,
                });
                close();
              }}
            />
          )}
        />
      )}
    </>
  );
};

type InvitationModalConnectedProps = {
  openState: OpenState;
  tagIds?: number[];
};

export const InviteMemberModal = (props: InvitationModalConnectedProps) => {
  return <InviteMembreModal {...props} />;
};
