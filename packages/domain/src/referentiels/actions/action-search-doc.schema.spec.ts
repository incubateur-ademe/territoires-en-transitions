import { ActionSearchDocSchema } from './action-search-doc.schema';

describe('ActionSearchDocSchema', () => {
  it("parses an action with type 'sous-action' and a composite id", () => {
    const result = ActionSearchDocSchema.safeParse({
      id: 'cae_1.1.1:42',
      collectiviteId: 42,
      actionId: 'cae_1.1.1',
      referentielId: 'cae',
      type: 'sous-action',
      nom: 'Installer des bornes',
      description: 'Description complète...',
      commentaire: null,
    });
    expect(result.success).toBe(true);
  });

  it('parses an action with a non-null commentaire', () => {
    const result = ActionSearchDocSchema.safeParse({
      id: 'eci_2.3:7',
      collectiviteId: 7,
      actionId: 'eci_2.3',
      referentielId: 'eci',
      type: 'action',
      nom: 'Réduire les emballages',
      description: '...',
      commentaire: 'En cours depuis 2024.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown action type', () => {
    const result = ActionSearchDocSchema.safeParse({
      id: 'cae_1.1:42',
      collectiviteId: 42,
      actionId: 'cae_1.1',
      referentielId: 'cae',
      type: 'not-a-real-type',
      nom: 'x',
      description: 'y',
      commentaire: null,
    });
    expect(result.success).toBe(false);
  });
});
