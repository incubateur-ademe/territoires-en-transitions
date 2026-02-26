'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableRow,
  VisibleWhen,
} from '@tet/ui';
import { useSendInvitation } from '../invite-membre/use-send-invitation';
import InvitationTableRow from './list-invitations.table-row';
import { useListPendingInvitations } from './use-list-pending-invitations';

export function ListInvitationsTable() {
  const { data: invitations } = useListPendingInvitations();
  const { mutate: sendInvitation } = useSendInvitation();

  const { hasCollectivitePermission } = useCurrentCollectivite();

  const canMutateMembres = hasCollectivitePermission(
    'collectivites.membres.mutate'
  );

  if (!invitations || invitations.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-lg font-bold text-primary-10 mb-3">
        Invitations en attente
      </h2>
      <div className="p-4 pt-2 lg:p-8 lg:pt-4 bg-white rounded-xl border border-grey-3">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Adresse mail</TableHeaderCell>
              <TableHeaderCell className="w-[12%]">Accès</TableHeaderCell>

              <VisibleWhen condition={canMutateMembres}>
                <TableHeaderCell className="w-[10%]">Actions</TableHeaderCell>
              </VisibleWhen>
            </TableRow>
          </TableHead>
          <tbody>
            {invitations?.map((invitation) => (
              <InvitationTableRow
                key={invitation.id}
                invitation={invitation}
                sendInvitation={sendInvitation}
                canMutateMembres={canMutateMembres}
              />
            ))}
          </tbody>
        </Table>
      </div>
    </section>
  );
}
