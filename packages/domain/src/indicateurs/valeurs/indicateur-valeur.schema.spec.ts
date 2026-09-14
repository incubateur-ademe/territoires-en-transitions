import {
  indicateurValeurGroupeeSchema,
  indicateurValeurSchemaCreate,
} from './indicateur-valeur.schema';

describe('indicateur valeur periodicite', () => {
  const valeur = {
    id: 1,
    collectiviteId: 1,
    indicateurId: 1,
    dateValeur: '2026-01-01',
    resultat: 42,
  };

  it.each(['annuelle', 'semestrielle', 'trimestrielle', 'mensuelle'])(
    'preserves %s as part of the value identity at the same date',
    (periodicite) => {
      const input = { ...valeur, periodicite };
      expect(indicateurValeurSchemaCreate.parse(input)).toEqual(input);
      expect(indicateurValeurGroupeeSchema.parse(input)).toMatchObject({
        id: valeur.id,
        dateValeur: valeur.dateValeur,
        periodicite,
      });
    }
  );

  it('requires periodicite when returning grouped values', () => {
    expect(indicateurValeurGroupeeSchema.safeParse(valeur).success).toBe(false);
  });

  it('keeps creation compatible with existing annual declarations', () => {
    expect(indicateurValeurSchemaCreate.parse(valeur)).toEqual(valeur);
  });

  it('rejects an unknown periodicite when creating a value', () => {
    expect(
      indicateurValeurSchemaCreate.safeParse({
        ...valeur,
        periodicite: 'hebdomadaire',
      }).success
    ).toBe(false);
  });
});
