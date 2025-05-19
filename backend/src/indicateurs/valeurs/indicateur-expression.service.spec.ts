import { Test } from '@nestjs/testing';
import IndicateurExpressionService from './indicateur-expression.service';

// décommenter (et lancer les tests) pour màj la doc
//import { generateDiagrams } from '@/backend/utils/expression-parser/generate-diagrams';
//import { parser } from './indicateur-expression.service';
//generateDiagrams(parser, __dirname);

describe('IndicateurExpressionService', () => {
  let indicateurExpressionService: IndicateurExpressionService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [IndicateurExpressionService],
    }).compile();

    indicateurExpressionService = moduleRef.get(
      IndicateurExpressionService
    );
  });

  describe('extractNeededSourceIndicateursFromFormula', () => {
    test('Test simple formula', async () => {
      const formula = 'val(Cae_1.e ) + val( cae_1.F)';
      const neededSourceIndicateurs =
        indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          formula
        );
      expect(neededSourceIndicateurs).toEqual([
        { identifiant: 'cae_1.e', optional: false },
        { identifiant: 'cae_1.f', optional: false },
      ]);
    });

    test('Simple formula with optional value', async () => {
      const formula = 'val(cae_1.e ) + opt_val( cae_1.f)';
      const neededSourceIndicateurs =
        indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          formula
        );
      expect(neededSourceIndicateurs).toEqual([
        { identifiant: 'cae_1.e', optional: false },
        { identifiant: 'cae_1.f', optional: true },
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
        { identifiant: 'cae_1.e', optional: false },
        { identifiant: 'cae_1.g', optional: false },
        { identifiant: 'cae_1.h', optional: false },
        { identifiant: 'cae_1.f', optional: true },
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
        { identifiant: 'cae_1.e', optional: false },
        { identifiant: 'cae_1.f', optional: false },
      ]);
    });

    test('Simple formula with source', async () => {
      const formula = 'opt_val(cae_1.a, rare) / val(terr_1, insee )';
      const neededSourceIndicateurs =
        indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          formula
        );
      expect(neededSourceIndicateurs).toEqual([
        { identifiant: 'terr_1', optional: false, source: 'insee' },
        { identifiant: 'cae_1.a', optional: true, source: 'rare' },
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
            limite: { 'cae_1.g': 10 },
            cible: { 'cae_1.h': 20 },
          }
        )
      ).toEqual(160);
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
            limite: { 'cae_6.a': 20 },
            cible: { 'cae_6.a': 5 },
          }
        )
      ).toEqual(0);

      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          formule,
          { 'cae_6.a': 10 },
          {
            limite: { 'cae_6.a': 2 },
            cible: { 'cae_6.a': 5 },
          }
        )
      ).toEqual(1);

      const input = {
        limite: { 'cae_6.a': 2 },
        cible: { 'cae_6.a': 5 },
      };
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          formule,
          { 'cae_6.a': 3 },
          input
        )
      ).toEqual(
        ((3 - input.limite['cae_6.a']) * 0.1) /
          (input.limite['cae_6.a'] - input.cible['cae_6.a'])
      );
    });
  });
});
