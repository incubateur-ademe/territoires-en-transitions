import { describe, expect, it } from 'vitest';
import {
  createIndicateurDefinitionInputSchema,
  updateIndicateurDefinitionInputSchema,
} from './mutate-definition.input';

describe('indicateur definition periodicite input boundary', () => {
  it("applique la compatibilité annuelle à la création lorsqu'elle est absente", () => {
    const input = createIndicateurDefinitionInputSchema.parse({
      collectiviteId: 1,
      titre: 'Indicateur historique',
    });

    expect(input.periodicite).toBe('annuelle');
  });

  it("ne transforme pas l'absence de périodicité en mise à jour annuelle", () => {
    const input = updateIndicateurDefinitionInputSchema.parse({
      collectiviteId: 1,
      indicateurId: 2,
      indicateurFields: { titre: 'Nouveau titre' },
    });

    expect(input.indicateurFields).not.toHaveProperty('periodicite');
  });
});
