'use client';

import { Invitation } from '@/app/collectivites/membres/list-invitations/use-list-pending-invitations';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { Button, TableCell, TableRow, Tooltip } from '@tet/ui';
import { useState } from 'react';
import BadgeAcces from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/users/_components/badge-acces';
import { SendInvitationArgs } from '../invite-membre/use-send-invitation';
import { ConfirmerSuppressionInvitation } from '../remove-invitation/confirm-remove-invitation.modal';

type Props = {
  invitation: Invitation;
  sendInvitation: (args: SendInvitationArgs) => void;
  canMutateMembres: boolean;
};

const ListInvitationsTableRow = ({
  invitation,
  sendInvitation,
  canMutateMembres,
}: Props) => {
  const [isOpenSuppression, setIsOpenSuppression] = useState(false);

  return (
    <>
      <TableRow data-test={`InvitationRow-${invitation.email}`}>
        <TableCell>
          <div className="text-sm text-primary-10 font-bold">
            {invitation.email}
          </div>
        </TableCell>
        <TableCell>
          <BadgeAcces acces={invitation.role} size="xs" />
        </TableCell>

        {canMutateMembres && (
          <TableCell>
            <div className="flex gap-2 justify-start items-center">
              <Tooltip label="Renvoyer l'invitation">
                <Button
                  size="xs"
                  variant="grey"
                  icon="mail-send-line"
                  onClick={() =>
                    sendInvitation({
                      invitationId: invitation.id,
                      email: invitation.email,
                    })
                  }
                />
              </Tooltip>
              <Tooltip label="Supprimer l'invitation">
                <DeleteButton
                  data-test="delete-invitation"
                  size="xs"
                  onClick={() => setIsOpenSuppression(true)}
                />
              </Tooltip>
            </div>
          </TableCell>
        )}
      </TableRow>

      {canMutateMembres && isOpenSuppression && (
        <ConfirmerSuppressionInvitation
          isOpen={isOpenSuppression}
          setIsOpen={setIsOpenSuppression}
          email={invitation.email}
        />
      )}
    </>
  );
};

export default ListInvitationsTableRow;
