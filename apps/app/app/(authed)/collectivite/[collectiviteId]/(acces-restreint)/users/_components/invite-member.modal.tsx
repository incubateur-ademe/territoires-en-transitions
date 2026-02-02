import {
  CollectiviteCurrent,
  useCurrentCollectivite,
} from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { UserWithRolesAndPermissions } from '@tet/domain/users';
import { Modal } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { InviteMemberForm } from './invite-member.form';
import { useCreateInvitation } from './use-create-invitation';

type InvitationModalProps = {
  openState: OpenState;
  collectivite: CollectiviteCurrent;
  currentUser: UserWithRolesAndPermissions;
  tagIds?: number[];
};

const InvitationModal = ({
  openState,
  collectivite,
  currentUser,
  tagIds,
}: InvitationModalProps) => {
  const { collectiviteId, collectiviteNom, role } = collectivite;

  const { mutate: createInvitation } = useCreateInvitation(
    collectiviteId,
    collectiviteNom,
    currentUser
  );

  return (
    <>
      {openState.isOpen && role && (
        <Modal
          openState={openState}
          title="Inviter un membre"
          size="lg"
          render={({ close }) => (
            <InviteMemberForm
              collectiviteId={collectiviteId}
              role={role}
              defaultTagIds={tagIds}
              onCancel={close}
              onSubmit={({ email, niveau, tagIds }) => {
                createInvitation({
                  collectiviteId,
                  email: email.toLowerCase(),
                  accessLevel: niveau,
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
  const user = useUser();
  const collectivite = useCurrentCollectivite();

  return (
    <InvitationModal
      currentUser={user}
      collectivite={collectivite}
      {...props}
    />
  );
};
