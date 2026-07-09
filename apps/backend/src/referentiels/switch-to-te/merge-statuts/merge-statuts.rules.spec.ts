import { StatutAvancementEnum } from '@tet/domain/referentiels';
import {
  arrondiTripletCinqPourcent,
  deriveStatutDetailleAuPourcentage,
  deriveStatutDiscret,
  deriveStatutFromProjection,
  deriveTripletFromProjectedPoints,
  isTripletStatutDiscret,
  MERGE_STATUTS_STATUT_DISCRET_EPSILON,
} from './merge-statuts.rules';

describe('merge-statuts.rules', () => {
  describe('deriveTripletFromProjectedPoints', () => {
    it('calcule les fractions à partir des points projetés', () => {
      expect(
        deriveTripletFromProjectedPoints({
          pointFait: 7,
          pointProgramme: 0,
          pointPasFait: 3,
          pointPotentiel: 10,
        })
      ).toEqual([0.7, 0, 0.3]);
    });

    it('retourne [0,0,0] si pointPotentiel est nul', () => {
      expect(
        deriveTripletFromProjectedPoints({
          pointFait: 1,
          pointProgramme: 0,
          pointPasFait: 0,
          pointPotentiel: 0,
        })
      ).toEqual([0, 0, 0]);
    });
  });

  describe('isTripletStatutDiscret', () => {
    it('détecte un triplet pur [1,0,0]', () => {
      expect(isTripletStatutDiscret([1, 0, 0])).toBe(true);
    });

    it('absorbe le résidu post-arrondi scoring [0.999, 0, 0.001]', () => {
      expect(isTripletStatutDiscret([0.999, 0, 0.001])).toBe(true);
    });

    it('rejette un triplet détaillé [0.74, 0, 0.26]', () => {
      expect(isTripletStatutDiscret([0.74, 0, 0.26])).toBe(false);
    });

    it('rejette le bord détaillé [0.99, 0, 0.01] (0.01 > ε)', () => {
      expect(isTripletStatutDiscret([0.99, 0, 0.01])).toBe(false);
      expect(0.01).toBeGreaterThan(MERGE_STATUTS_STATUT_DISCRET_EPSILON);
    });
  });

  describe('deriveStatutDiscret', () => {
    it('retourne fait pour un triplet dominant fait', () => {
      expect(deriveStatutDiscret([1, 0, 0])).toEqual({
        statut: StatutAvancementEnum.FAIT,
      });
    });

    it('retourne fait pour un résidu post-arrondi scoring', () => {
      expect(deriveStatutDiscret([0.999, 0, 0.001])).toEqual({
        statut: StatutAvancementEnum.FAIT,
      });
    });
  });

  describe('arrondiTripletCinqPourcent', () => {
    it('arrondit à l inférieur au pas de 5 % (74 % → 70 %)', () => {
      expect(arrondiTripletCinqPourcent([0.74, 0, 0.26])).toEqual([
        0.7, 0, 0.3,
      ]);
    });

    it('recalcule pas_fait pour compléter à 100 %', () => {
      expect(arrondiTripletCinqPourcent([0.5, 0.5, 0])).toEqual([0.5, 0.5, 0]);
    });
  });

  describe('deriveStatutDetailleAuPourcentage', () => {
    it('retourne detaille avec le triplet arrondi', () => {
      expect(deriveStatutDetailleAuPourcentage([0.7, 0, 0.3])).toEqual({
        statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
        statutDetailleAuPourcentage: [0.7, 0, 0.3],
      });
    });
  });

  describe('deriveStatutFromProjection', () => {
    it('retourne NON_CONCERNE sans source concernée', () => {
      expect(
        deriveStatutFromProjection({
          concernedSourceCount: 0,
          pointFait: 0,
          pointProgramme: 0,
          pointPasFait: 0,
          pointPotentiel: 5,
        })
      ).toEqual({ statut: StatutAvancementEnum.NON_CONCERNE });
    });

    it('retourne NON_RENSEIGNE si sources concernées sans avancement', () => {
      expect(
        deriveStatutFromProjection({
          concernedSourceCount: 1,
          pointFait: 0,
          pointProgramme: 0,
          pointPasFait: 0,
          pointPotentiel: 5,
        })
      ).toEqual({ statut: StatutAvancementEnum.NON_RENSEIGNE });
    });

    it('retourne fait pour un triplet discret [1,0,0]', () => {
      expect(
        deriveStatutFromProjection({
          concernedSourceCount: 1,
          pointFait: 5,
          pointProgramme: 0,
          pointPasFait: 0,
          pointPotentiel: 5,
        })
      ).toEqual({ statut: StatutAvancementEnum.FAIT });
    });

    it('retourne fait pour un résidu post-arrondi scoring', () => {
      expect(
        deriveStatutFromProjection({
          concernedSourceCount: 1,
          pointFait: 4.995,
          pointProgramme: 0,
          pointPasFait: 0.005,
          pointPotentiel: 5,
        })
      ).toEqual({ statut: StatutAvancementEnum.FAIT });
    });

    it('retourne detaille + triplet arrondi pour [0.74, 0, 0.26]', () => {
      expect(
        deriveStatutFromProjection({
          concernedSourceCount: 1,
          pointFait: 3.7,
          pointProgramme: 0,
          pointPasFait: 1.3,
          pointPotentiel: 5,
        })
      ).toEqual({
        statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
        statutDetailleAuPourcentage: [0.7, 0, 0.3],
      });
    });

    it('retourne detaille pour le bord [0.99, 0, 0.01]', () => {
      expect(
        deriveStatutFromProjection({
          concernedSourceCount: 1,
          pointFait: 4.95,
          pointProgramme: 0,
          pointPasFait: 0.05,
          pointPotentiel: 5,
        })
      ).toEqual({
        statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
        statutDetailleAuPourcentage: [0.95, 0, 0.05],
      });
    });
  });
});
