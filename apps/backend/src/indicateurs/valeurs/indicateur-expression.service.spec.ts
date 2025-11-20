import { Test } from '@nestjs/testing';
import { CollectiviteTypeEnum } from '@tet/domain/collectivites';
import IndicateurExpressionService from './indicateur-expression.service';

// décommenter (et lancer les tests) pour màj la doc
//import { generateDiagrams } from '@tet/backend/utils/expression-parser/generate-diagrams';
//import { parser } from './indicateur-expression.service';
//generateDiagrams(parser, __dirname);

describe('IndicateurExpressionService', () => {
  let indicateurExpressionService: IndicateurExpressionService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [IndicateurExpressionService],
    }).compile();

    indicateurExpressionService = moduleRef.get(IndicateurExpressionService);
  });

  describe('extractNeededSourceIndicateursFromFormula', () => {
    test('Test simple formula', async () => {
      const formula = 'val(Cae_1.e ) + val( cae_1.F)';
      const neededSourceIndicateurs =
        indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          formula
        );
      expect(neededSourceIndicateurs).toEqual([
        { identifiant: 'cae_1.e', optional: false, tokens: ['val'] },
        { identifiant: 'cae_1.f', optional: false, tokens: ['val'] },
      ]);
    });

    test('Simple formula with optional value', async () => {
      const formula = 'val(cae_1.e ) + opt_val( cae_1.f)';
      const neededSourceIndicateurs =
        indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          formula
        );
      expect(neededSourceIndicateurs).toEqual([
        { identifiant: 'cae_1.e', optional: false, tokens: ['val'] },
        { identifiant: 'cae_1.f', optional: true, tokens: ['opt_val'] },
      ]);
    });

    test('Simple formula with target and limit values', async () => {
      const formula =
        'val(cae_1.e ) + opt_val( cae_1.f) + cible(cae_1.g) + limite(cae_1.h)';
      const neededSourceIndicateurs =
        indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          formula
        );
      expect(neededSourceIndicateurs).toEqual([
        { identifiant: 'cae_1.e', optional: false, tokens: ['val'] },
        { identifiant: 'cae_1.f', optional: true, tokens: ['opt_val'] },
        { identifiant: 'cae_1.g', optional: false, tokens: ['cible'] },
        { identifiant: 'cae_1.h', optional: false, tokens: ['limite'] },
      ]);
    });

    test('No indicateurs', async () => {
      const formula = '10 + 30';
      const neededSourceIndicateurs =
        indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          formula
        );
      expect(neededSourceIndicateurs).toEqual([]);
    });

    test('Same indicateur twice', async () => {
      const formula = '(val(cae_1.e) + val(cae_1.f)) / val(cae_1.e)';
      const neededSourceIndicateurs =
        indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          formula
        );
      expect(neededSourceIndicateurs).toEqual([
        { identifiant: 'cae_1.e', optional: false, tokens: ['val'] },
        { identifiant: 'cae_1.f', optional: false, tokens: ['val'] },
      ]);
    });

    test('Same indicateur twice with optional and required references', async () => {
      const formula = '(val(cae_1.e) + val(cae_1.f)) / opt_val(cae_1.e)';
      const neededSourceIndicateurs =
        indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          formula
        );
      expect(neededSourceIndicateurs).toEqual([
        { identifiant: 'cae_1.e', optional: false, tokens: ['val', 'opt_val'] },
        { identifiant: 'cae_1.f', optional: false, tokens: ['val'] },
      ]);
    });

    test('Simple formula with source', async () => {
      const formula = 'opt_val(cae_1.a, rare) / val(terr_1, insee )';
      const neededSourceIndicateurs =
        indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          formula
        );
      expect(neededSourceIndicateurs).toEqual([
        {
          identifiant: 'cae_1.a',
          optional: true,
          sources: ['rare'],
          tokens: ['opt_val'],
        },
        {
          identifiant: 'terr_1',
          optional: false,
          sources: ['insee'],
          tokens: ['val'],
        },
      ]);
    });

    test('Simple formula with dash into identifier', async () => {
      const formula = 'opt_val(cae_49.b-hab) + val(cae_49.c-hab)';
      const neededSourceIndicateurs =
        indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          formula
        );
      expect(neededSourceIndicateurs).toEqual([
        {
          identifiant: 'cae_49.b-hab',
          optional: true,
          tokens: ['opt_val'],
        },
        {
          identifiant: 'cae_49.c-hab',
          optional: false,
          tokens: ['val'],
        },
      ]);
    });
  });

  describe('parseExpression', () => {
    test('val(cae_1.e) + val(cae_1.f)', async () => {
      expect(
        indicateurExpressionService.parseExpression(
          'val(cae_1.e) + val(cae_1.f)'
        )
      ).toBeTruthy();
    });

    test('Formate les erreurs de parsing', () => {
      try {
        indicateurExpressionService.parseExpression(`si val(cae_1)`);
      } catch (e) {
        expect(e).toBeDefined();
        expect((e as Error).message).toEqual(
          "MismatchedTokenException: Expecting token of type --> ALORS <-- but found --> '' <-- (1:13)"
        );
      }
    });
  });

  describe('parseAndEvaluateExpression', () => {
    test('val(cae_1.e) + val(cae_1.f) with all values', async () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          'val(cae_1.e) + val(cae_1.f)',
          {
            'cae_1.e': 100,
            'cae_1.f': 20,
          }
        )
      ).toEqual(120);
    });

    test('val(cae_1.e) + val(cae_1.f) with missing value', async () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          'val(cae_1.e) + val(cae_1.f)',
          {
            'cae_1.e': 100,
          }
        )
      ).toEqual(null);
    });

    test('val(cae_1.e) + opt_val(cae_1.f) with given optional value', async () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          'val(cae_1.e) + opt_val(cae_1.f)',
          {
            'cae_1.e': 100,
            'cae_1.f': 20,
          }
        )
      ).toEqual(120);
    });

    test('val(cae_1.e) + opt_val(cae_1.f) with missing optional value', async () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          'val(cae_1.e) + opt_val(cae_1.f)',
          {
            'cae_1.e': 100,
          }
        )
      ).toEqual(100);
    });

    test('opt_val(cae_1.e) + opt_val(cae_1.f) with all missing optional value', async () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          'opt_val(cae_1.e) + opt_val(cae_1.f)',
          {}
        )
      ).toEqual(null);
    });

    test('1 + val(cae_1.f) / val(cae_1.e)', async () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          '1 + val(cae_1.f) / val(cae_1.e)',
          {
            'cae_1.e': 100,
            'cae_1.f': 20,
          }
        )
      ).toEqual(1.2);
    });

    test('val(cae_1.f) / opt_val(cae_1.e) for infinity', async () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          'val(cae_1.f) / opt_val(cae_1.e)',
          {
            'cae_1.f': 20,
          }
        )
      ).toEqual(null);
    });

    test('val(cae_1.e) + limite(cae_1.g) + cible(cae_1.h) + val(cae_1.i) with all values', async () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          'val(cae_1.e) + limite(cae_1.g) + cible(cae_1.h) + val(cae_1.i)',
          {
            'cae_1.e': 100,
            'cae_1.i': 30,
          },
          {
            valeursComplementaires: {
              limite: { 'cae_1.g': 10 },
              cible: { 'cae_1.h': 20 },
            },
          }
        )
      ).toEqual(160);
    });

    test('limite(cae_1.e) + cible(cae_1.f) with values equal to zero', async () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          'limite(cae_1.e) + cible(cae_1.f)',
          {},
          {
            valeursComplementaires: {
              limite: { 'cae_1.e': 0 },
              cible: { 'cae_1.f': 0 },
            },
          }
        )
      ).toEqual(0);
    });

    test('val(cae_17.b) / cible(cae_17.b) with value equal to zero', async () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          `val(cae_17.b) / cible(cae_17.b)`,
          { 'cae_17.b': 0 },
          {
            valeursComplementaires: {
              limite: {},
              cible: { 'cae_17.b': 32 },
            },
          }
        )
      ).toEqual(0);
    });

    /**
     * - si valeur de la collectivité < valeur limite alors 0
     * - si valeur de la collectivité > valeur cible alors 1
     * - sinon (valeur de la collectivité - valeur limite) * 10 % / (valeur limite - valeur cible)
     */
    test('1.2.3.3.1- indicateur 6a', async () => {
      const formule = `
          si val(cae_6.a) < limite(cae_6.a) alors 0
          sinon si val(cae_6.a) > cible(cae_6.a) alors 1
          sinon ((val(cae_6.a) - limite(cae_6.a)) * 0.1) / (limite(cae_6.a) - cible(cae_6.a))`;

      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          formule,
          { 'cae_6.a': 10 },
          {
            valeursComplementaires: {
              limite: { 'cae_6.a': 20 },
              cible: { 'cae_6.a': 5 },
            },
          }
        )
      ).toEqual(0);

      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          formule,
          { 'cae_6.a': 10 },
          {
            valeursComplementaires: {
              limite: { 'cae_6.a': 2 },
              cible: { 'cae_6.a': 5 },
            },
          }
        )
      ).toEqual(1);

      const input = {
        valeursComplementaires: {
          limite: { 'cae_6.a': 2 },
          cible: { 'cae_6.a': 5 },
        },
      };
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          formule,
          { 'cae_6.a': 3 },
          input
        )
      ).toEqual(
        ((3 - input.valeursComplementaires.limite['cae_6.a']) * 0.1) /
          (input.valeursComplementaires.limite['cae_6.a'] -
            input.valeursComplementaires.cible['cae_6.a'])
      );
    });

    /**
     * 2.2.1.4.2 et 2.2.2.4.2 - indicateur 15b 15b-DOM
      - 10 % (ou 20 % DOM)
      - calcul
          - si valeur de la collectivité < valeur limite alors 0
          - si valeur de la collectivité > valeur cible alors 1
          - sinon (valeur de la collectivité - valeur limite) * 10 ou 20 % / (valeur
            limite - valeur cible)

     */
    test('2.2.2.4.2 - indicateur 15b', () => {
      const formule = `
        si identite(localisation, DOM) alors (
          si val(cae_15.b_dom) < limite(cae_15.b_dom) alors 0
          sinon si val(cae_15.b_dom) > cible(cae_15.b_dom) alors 1
          sinon ((val(cae_15.b_dom) - limite(cae_15.b_dom)) * 0.2) / (limite(cae_15.b_dom) - cible(cae_15.b_dom))
        )
        sinon (
          si val(cae_15.b) < limite(cae_15.b) alors 0
          sinon si val(cae_15.b) > cible(cae_15.b) alors 1
          sinon ((val(cae_15.b) - limite(cae_15.b)) * 0.1) / (limite(cae_15.b) - cible(cae_15.b))
        )
      `;

      const identiteCollectivite = {
        type: CollectiviteTypeEnum.EPCI,
        soustype: null,
        drom: false,
        populationTags: [],
        dansAireUrbaine: false,
        test: false,
      };
      const valeurs = { 'cae_15.b': 3, 'cae_15.b_dom': 6 };
      const valeursComplementaires = {
        limite: { 'cae_15.b': 2, 'cae_15.b_dom': 4 },
        cible: { 'cae_15.b': 5, 'cae_15.b_dom': 10 },
      };

      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          formule,
          valeurs,
          { valeursComplementaires, identiteCollectivite }
        )
      ).toEqual(
        ((valeurs['cae_15.b'] - valeursComplementaires.limite['cae_15.b']) *
          0.1) /
          (valeursComplementaires.limite['cae_15.b'] -
            valeursComplementaires.cible['cae_15.b'])
      );

      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          formule,
          valeurs,
          {
            valeursComplementaires,
            identiteCollectivite: { ...identiteCollectivite, drom: true },
          }
        )
      ).toEqual(
        ((valeurs['cae_15.b_dom'] -
          valeursComplementaires.limite['cae_15.b_dom']) *
          0.2) /
          (valeursComplementaires.limite['cae_15.b_dom'] -
            valeursComplementaires.cible['cae_15.b_dom'])
      );
    });

    /**
      - calcul = somme de 2 valeurs :
      - Première valeur
          - si valeur de la collectivité < valeur limite alors 0
          - si valeur de la collectivité > valeur cible alors 1
          - sinon (valeur de la collectivité - valeur limite) * 30 % / (valeur limite - valeur cible)
      - Deuxième valeur
          - si valeur de la collectivité < valeur limite alors 0
          - si valeur de la collectivité > valeur cible alors 1
          - sinon (valeur de la collectivité - valeur limite) * 20 % / (valeur limite - valeur cible)
     */
    test('3.2.2.1 - indicateurs 22 et 23 ', () => {
      const formule = `
        (
          si val(cae_22) < limite(cae_22) alors 0
          sinon si val(cae_22) > cible(cae_22) alors 1
          sinon ((val(cae_22) - limite(cae_22)) * 0.3) / (limite(cae_22) - cible(cae_22))
        ) + (
          si val(cae_23) < limite(cae_23) alors 0
          sinon si val(cae_23) > cible(cae_23) alors 1
          sinon ((val(cae_23) - limite(cae_23)) * 0.2) / (limite(cae_23) - cible(cae_23))
        )
      `;

      const valeurs = { cae_22: 3, cae_23: 6 };
      const valeursComplementaires = {
        limite: { cae_22: 2, cae_23: 4 },
        cible: { cae_22: 5, cae_23: 10 },
      };

      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          formule,
          valeurs,
          { valeursComplementaires }
        )
      ).toEqual(
        ((valeurs.cae_22 - valeursComplementaires.limite.cae_22) * 0.3) /
          (valeursComplementaires.limite.cae_22 -
            valeursComplementaires.cible.cae_22) +
          ((valeurs.cae_23 - valeursComplementaires.limite.cae_23) * 0.2) /
            (valeursComplementaires.limite.cae_23 -
              valeursComplementaires.cible.cae_23)
      );
    });

    /*
    1.2.2.5.4 - indicateur 5

    - 10 % ou 20 % si AOM
    - calcul
      - si valeur de la collectivité < valeur limite alors 0
      - si valeur de la collectivité > valeur cible alors 1
      - sinon (valeur de la collectivité - valeur limite) * 10 ou 20 % / (valeur limite - valeur cible)
    */
    test('1.2.2.5.4 - indicateur 5', () => {
      const formule = `
        si val(cae_5) < limite(cae_5) alors 0
        sinon si val(cae_5) > cible(cae_5) alors 1
        sinon ((val(cae_5) - limite(cae_5)) * (si reponse(AOM_1, oui) alors 0.2 sinon 0.1)) / (limite(cae_5) - cible(cae_5))
      `;
      const valeurs = { cae_5: 3 };
      const valeursComplementaires = {
        limite: { cae_5: 2 },
        cible: { cae_5: 10 },
      };

      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          formule,
          valeurs,
          { valeursComplementaires, reponses: { AOM_1: true } }
        )
      ).toEqual(
        ((valeurs.cae_5 - valeursComplementaires.limite.cae_5) * 0.2) /
          (valeursComplementaires.limite.cae_5 -
            valeursComplementaires.cible.cae_5)
      );

      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          formule,
          valeurs,
          { valeursComplementaires, reponses: { AOM_1: false } }
        )
      ).toEqual(
        ((valeurs.cae_5 - valeursComplementaires.limite.cae_5) * 0.1) /
          (valeursComplementaires.limite.cae_5 -
            valeursComplementaires.cible.cae_5)
      );
    });
  });
});
