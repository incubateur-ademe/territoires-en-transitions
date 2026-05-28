import { describe, expect, it } from 'vitest';
import { filtersRequestSchema } from './filters.request';

const baseInput = {
  typesPlan: [],
  regions: [],
  departments: [],
  typesCollectivite: [],
  population: [],
  referentiel: [],
  niveauDeLabellisation: [],
  realiseCourant: [],
  tauxDeRemplissage: [],
  nbCards: 10,
};

describe('filtersRequestSchema', () => {
  describe('valeurs légitimes', () => {
    it('accepte un payload vide', () => {
      expect(filtersRequestSchema.safeParse(baseInput).success).toBe(true);
    });

    it('accepte des codes région INSEE', () => {
      const result = filtersRequestSchema.safeParse({
        ...baseInput,
        regions: ['27', '11', '75', '01'],
      });
      expect(result.success).toBe(true);
    });

    it('accepte les codes département dont les codes corses', () => {
      const result = filtersRequestSchema.safeParse({
        ...baseInput,
        departments: ['51', '31', '2A', '2B', '971'],
      });
      expect(result.success).toBe(true);
    });

    it('accepte les identifiants de tranche `filtre_intervalle`', () => {
      const result = filtersRequestSchema.safeParse({
        ...baseInput,
        population: ['<20000', '20000-50000'],
        realiseCourant: ['50-64', '35-49'],
        tauxDeRemplissage: ['80-99'],
      });
      expect(result.success).toBe(true);
    });

    it('accepte les types de collectivité (enum + syndicat)', () => {
      const result = filtersRequestSchema.safeParse({
        ...baseInput,
        typesCollectivite: ['syndicat', 'commune', 'epci'],
      });
      expect(result.success).toBe(true);
    });

    it('accepte les niveaux de labellisation 0-5', () => {
      const result = filtersRequestSchema.safeParse({
        ...baseInput,
        niveauDeLabellisation: ['0', '1', '2', '3', '4', '5'],
      });
      expect(result.success).toBe(true);
    });

    it('accepte les référentiels connus', () => {
      const result = filtersRequestSchema.safeParse({
        ...baseInput,
        referentiel: ['eci', 'cae', 'te', 'te-test'],
      });
      expect(result.success).toBe(true);
    });
  });

  // Régression du pentest ORHUS-302 V1 (Injection SQL via le paramètre
  // `regions` du formulaire de recherche de collectivités). Chaque entrée
  // utilisateur de type tableau de chaînes doit refuser tout caractère qui
  // permettrait d'échapper d'une liste `IN (...)`.
  describe('protection contre les injections SQL (pentest V1)', () => {
    const sqlInjectionPayloads = [
      "27'); DROP TABLE collectivite; --",
      "27' UNION SELECT password FROM users; --",
      "27' OR 1=1 --",
      "'; SELECT * FROM dcp; --",
      '27; DROP TABLE collectivite',
      '27, (SELECT 1)',
      '27/**/UNION/**/SELECT',
    ];

    it.each(sqlInjectionPayloads)(
      'rejette le payload `%s` dans `regions`',
      (payload) => {
        const result = filtersRequestSchema.safeParse({
          ...baseInput,
          regions: [payload],
        });
        expect(result.success).toBe(false);
      }
    );

    it.each(sqlInjectionPayloads)(
      'rejette le payload `%s` dans `departments`',
      (payload) => {
        const result = filtersRequestSchema.safeParse({
          ...baseInput,
          departments: [payload],
        });
        expect(result.success).toBe(false);
      }
    );

    it.each(sqlInjectionPayloads)(
      'rejette le payload `%s` dans `population`',
      (payload) => {
        const result = filtersRequestSchema.safeParse({
          ...baseInput,
          population: [payload],
        });
        expect(result.success).toBe(false);
      }
    );

    it.each(sqlInjectionPayloads)(
      'rejette le payload `%s` dans `typesCollectivite`',
      (payload) => {
        const result = filtersRequestSchema.safeParse({
          ...baseInput,
          typesCollectivite: [payload],
        });
        expect(result.success).toBe(false);
      }
    );

    it.each(sqlInjectionPayloads)(
      'rejette le payload `%s` dans `realiseCourant`',
      (payload) => {
        const result = filtersRequestSchema.safeParse({
          ...baseInput,
          realiseCourant: [payload],
        });
        expect(result.success).toBe(false);
      }
    );

    it.each(sqlInjectionPayloads)(
      'rejette le payload `%s` dans `tauxDeRemplissage`',
      (payload) => {
        const result = filtersRequestSchema.safeParse({
          ...baseInput,
          tauxDeRemplissage: [payload],
        });
        expect(result.success).toBe(false);
      }
    );

    it.each(sqlInjectionPayloads)(
      'rejette le payload `%s` dans `niveauDeLabellisation`',
      (payload) => {
        const result = filtersRequestSchema.safeParse({
          ...baseInput,
          niveauDeLabellisation: [payload],
        });
        expect(result.success).toBe(false);
      }
    );

    it.each(sqlInjectionPayloads)(
      'rejette le payload `%s` dans `referentiel`',
      (payload) => {
        const result = filtersRequestSchema.safeParse({
          ...baseInput,
          referentiel: [payload],
        });
        expect(result.success).toBe(false);
      }
    );
  });

  describe('bornes des champs numériques', () => {
    it("limite `nbCards` à un entier strictement positif", () => {
      expect(
        filtersRequestSchema.safeParse({ ...baseInput, nbCards: 0 }).success
      ).toBe(false);
      expect(
        filtersRequestSchema.safeParse({ ...baseInput, nbCards: -10 }).success
      ).toBe(false);
      expect(
        filtersRequestSchema.safeParse({ ...baseInput, nbCards: 1.5 }).success
      ).toBe(false);
    });

    it('rejette une page négative ou nulle', () => {
      expect(
        filtersRequestSchema.safeParse({ ...baseInput, page: 0 }).success
      ).toBe(false);
      expect(
        filtersRequestSchema.safeParse({ ...baseInput, page: -1 }).success
      ).toBe(false);
    });
  });
});
