import { describe, expect, it } from 'vitest';
import { isComposeSansAgregation } from './indicateur-predefini-compose.rules';

const ENFANTS = [{ id: 11 }, { id: 12 }];

describe('isComposeSansAgregation', () => {
  it('reconnaît un indicateur sans valeur utilisateur qui a des sous-indicateurs', () => {
    expect(
      isComposeSansAgregation({
        enfants: ENFANTS,
        sansValeurUtilisateur: true,
      })
    ).toBe(true);
  });

  it('ne reconnaît pas un parent qui accepte ses propres valeurs', () => {
    expect(
      isComposeSansAgregation({
        enfants: ENFANTS,
        sansValeurUtilisateur: false,
      })
    ).toBe(false);
  });

  it("ne reconnaît pas un indicateur sans valeur utilisateur qui n'a aucun sous-indicateur", () => {
    expect(
      isComposeSansAgregation({ enfants: [], sansValeurUtilisateur: true })
    ).toBe(false);
  });
});
