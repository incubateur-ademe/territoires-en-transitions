import {
  AgentInvitationResponse,
  createAgentInvitation,
  fetchAgentInvitation,
} from 'core-logic/api/procedures/invitationProcedures';
import {supabaseClient} from 'core-logic/api/supabase';
import {yoloCredentials} from 'test_utils/collectivites';

describe('Create an invitation', () => {
  test.skip('should return a new invitation', async () => {
    await supabaseClient.auth.signIn(yoloCredentials);
    const partialExemple: Partial<AgentInvitationResponse> = {
      message: "L'invitation a été crée.",
    };
    const procedureResponse = await createAgentInvitation(1);

    expect(procedureResponse).toEqual(expect.objectContaining(partialExemple));
    expect(procedureResponse.id?.length).toBe(36);
  });
});

describe('Retrieve an invitation', () => {
  test.skip('should return the latest existing invitation', async () => {
    await supabaseClient.auth.signIn(yoloCredentials);
    const procedureResponse = await fetchAgentInvitation(1);
    expect(procedureResponse.id?.length).toBe(36);
  });
});
