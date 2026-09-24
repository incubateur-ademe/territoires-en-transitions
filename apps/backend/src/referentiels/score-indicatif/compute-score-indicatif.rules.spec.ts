import { IndicateurAssocie, ValeurUtilisee } from '@tet/domain/referentiels';
import {
  buildAnneesPourExpression,
  buildValeursPourExpression,
  pickValeursUtiliseesPourResultat,
} from './compute-score-indicatif.rules';

const indicateurAssocie: IndicateurAssocie = {
  actionId: 'cae_1.1.1',
  indicateurId: 42,
  identifiantReferentiel: 'ind_test',
  titre: 'Indicateur de test',
  unite: '%',
  isApplicable: true,
};

const valeurUtilisee: ValeurUtilisee = {
  actionId: 'cae_1.1.1',
  indicateurId: 42,
  indicateurValeurId: 1,
  valeur: 10,
  dateValeur: '2023-01-01',
  typeScore: 'fait',
  sourceLibelle: 'Ma source',
  sourceMetadonnee: null,
};

describe('compute-score-indicatif.rules', () => {
  describe('buildAnneesPourExpression', () => {
    it("associe l'année de la dateValeur à l'identifiant référentiel", () => {
      expect(
        buildAnneesPourExpression(
          [{ ...valeurUtilisee, dateValeur: '2025-05-29' }],
          [indicateurAssocie]
        )
      ).toEqual({ ind_test: 2025 });
    });

    it('ignore les indicateurs non associés', () => {
      expect(
        buildAnneesPourExpression(
          [{ ...valeurUtilisee, indicateurId: 99 }],
          [indicateurAssocie]
        )
      ).toEqual({});
    });
  });

  describe('buildValeursPourExpression', () => {
    it("construit la table identifiant référentiel -> valeur à partir de l'indicateur associé", () => {
      const result = buildValeursPourExpression(
        [valeurUtilisee],
        [indicateurAssocie]
      );

      expect(result).toEqual({ ind_test: 10 });
    });

    it("ignore les valeurs dont l'indicateur n'est pas associé", () => {
      const result = buildValeursPourExpression(
        [{ ...valeurUtilisee, indicateurId: 999 }],
        [indicateurAssocie]
      );

      expect(result).toEqual({});
    });
  });

  describe('pickValeursUtiliseesPourResultat', () => {
    it('ne garde que les champs pertinents pour le résultat', () => {
      const result = pickValeursUtiliseesPourResultat([valeurUtilisee]);

      expect(result).toEqual([
        {
          valeur: 10,
          dateValeur: '2023-01-01',
          sourceLibelle: 'Ma source',
          sourceMetadonnee: null,
          indicateurId: 42,
        },
      ]);
    });
  });
});
