import { appLabels } from '@/app/labels/catalog';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { OpenState } from '@tet/ui/utils/types';
import { InviteMembreForm } from './invite-membre.form';
import { useInviteMembre } from './use-invite-membre';

type InvitationModalProps = {
  openState: OpenState;
  tagIds?: number[];
};

export const InviteMemberModal = ({
  openState,
  tagIds,
}: InvitationModalProps) => {
  const { mutate: createInvitation } = useInviteMembre();

  if (!openState.isOpen) return null;

  return (
    <Modal openState={openState} size="lg">
      <Modal.Header>
        <Modal.Title>{appLabels.inviterMembre}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <InviteMembreForm
          defaultTagIds={tagIds}
          onCancel={() => openState.setIsOpen(false)}
          onSubmit={({ email, niveau, tagIds }) => {
            createInvitation({
              email: email.toLowerCase(),
              role: niveau,
              tagIds,
            });
            openState.setIsOpen(false);
          }}
        />
      </Modal.Body>
    </Modal>
  );
};
