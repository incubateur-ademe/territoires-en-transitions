import { ActionDefinition } from './action-definition.schema';
import { applyActionTextOverrides } from './action-text-overrides.schema';

const definition = {
  actionId: 'te_1',
  nom: 'Nom',
  description: 'Description',
  preuve: 'Preuve',
} as Pick<ActionDefinition, 'actionId' | 'nom' | 'description' | 'preuve'>;

describe('applyActionTextOverrides', () => {
  test('sans surcharge, renvoie la définition telle quelle', () => {
    expect(applyActionTextOverrides(definition, undefined)).toBe(definition);
  });

  test('ne remplace que les champs surchargés', () => {
    expect(
      applyActionTextOverrides(definition, { nom: 'Nom DOM', preuve: null })
    ).toEqual({
      actionId: 'te_1',
      nom: 'Nom DOM',
      description: 'Description',
      preuve: null,
    });
    expect(definition.nom).toBe('Nom');
  });

  test('ignore les champs qui ne sont pas des textes balisables', () => {
    expect(
      applyActionTextOverrides(definition, {
        actionId: 'autre',
      } as never)
    ).toEqual(definition);
  });
});
