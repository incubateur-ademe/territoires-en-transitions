import { ListInvitationsTable } from '@/app/collectivites/membres/list-invitations/list-invitations.table';
import { ListmembresTable } from '@/app/collectivites/membres/list-membres/list-membres.table';

export default function MembresPage() {
  return (
    <div className="flex flex-col gap-8">
      <ListInvitationsTable />
      <ListmembresTable />
    </div>
  );
}
