import {
  actionDefinitionSummaryReadEndpoint,
  ActionDefinitionSummary,
} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {supabaseClient} from "../supabase";
import {yuluCredentials} from "../../../test_utils/collectivites";

describe('Action summary endpoint', () => {
  it('should return the action summary', async () => {
    await supabaseClient.auth.signInWithPassword(yuluCredentials);
    const partialAction: Partial<ActionDefinitionSummary> = {
      id: 'eci_1.1',
      referentiel: 'eci',
      depth: 2,
      type: 'action',
      identifiant: '1.1',
    };

    const summaries = await actionDefinitionSummaryReadEndpoint.getBy({
      referentiel: 'eci',
      identifiant: '1.1',
    });

    expect(summaries[0]).toEqual(expect.objectContaining(partialAction));
  });
});
