import {useEffect, useState} from 'react';
import {fetchAgentInvitation} from 'core-logic/api/procedures/invitationProcedures';

export const useAgentInvitationId = (collectiviteId: number) => {
  const [invitationId, setInvitationId] = useState<string | null>(null);

  useEffect(() => {
    fetchAgentInvitation(collectiviteId).then(response =>
      setInvitationId(response.id ?? null)
    );
  }, [collectiviteId]);

  return invitationId;
};
