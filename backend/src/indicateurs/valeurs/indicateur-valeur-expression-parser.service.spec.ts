import IndicateurValeurExpressionParserService from '@/backend/indicateurs/valeurs/indicateur-valeur-expression-parser.service';
import { Test } from '@nestjs/testing';

describe('IndicateurValeurExpressionParserService', () => {
  let indicateurValeurExpressionParserService: IndicateurValeurExpressionParserService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [IndicateurValeurExpressionParserService],
    })
      .useMocker((token) => {})
      .compile();

    indicateurValeurExpressionParserService = moduleRef.get(
      IndicateurValeurExpressionParserService
    );
  });

  describe('extractNeededSourceIndicateursFromFormula', () => {
    test('Test simple formula', async () => {
      const formula = 'val(Cae_1.e ) + val( cae_1.F)';
      const neededSourceIndicateurs =
        indicateurValeurExpressionParserService.extractNeededSourceIndicateursFromFormula(
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
        indicateurValeurExpressionParserService.extractNeededSourceIndicateursFromFormula(
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
        indicateurValeurExpressionParserService.extractNeededSourceIndicateursFromFormula(
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
        indicateurValeurExpressionParserService.extractNeededSourceIndicateursFromFormula(
          formula
        );
      expect(neededSourceIndicateurs).toEqual([]);
    });

    test('Same indicateur twice', async () => {
      const formula = '(val(cae_1.e) + val(cae_1.f)) / val(cae_1.e)';
      const neededSourceIndicateurs =
        indicateurValeurExpressionParserService.extractNeededSourceIndicateursFromFormula(
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
        indicateurValeurExpressionParserService.extractNeededSourceIndicateursFromFormula(
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
        indicateurValeurExpressionParserService.parseExpression(
          'val(cae_1.e) + val(cae_1.f)'
        )
      ).toBeTruthy();
    });
  });

  describe('parseAndEvaluateExpression', () => {
    test('val(cae_1.e) + val(cae_1.f) with all values', async () => {
      expect(
        indicateurValeurExpressionParserService.parseAndEvaluateExpression(
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
        indicateurValeurExpressionParserService.parseAndEvaluateExpression(
          'val(cae_1.e) + val(cae_1.f)',
          {
            'cae_1.e': 100,
          }
        )
      ).toEqual(null);
    });

    test('val(cae_1.e) + opt_val(cae_1.f) with given optional value', async () => {
      expect(
        indicateurValeurExpressionParserService.parseAndEvaluateExpression(
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
        indicateurValeurExpressionParserService.parseAndEvaluateExpression(
          'val(cae_1.e) + opt_val(cae_1.f)',
          {
            'cae_1.e': 100,
          }
        )
      ).toEqual(100);
    });

    test('opt_val(cae_1.e) + opt_val(cae_1.f) with all missing optional value', async () => {
      expect(
        indicateurValeurExpressionParserService.parseAndEvaluateExpression(
          'opt_val(cae_1.e) + opt_val(cae_1.f)',
          {}
        )
      ).toEqual(null);
    });

    test('1 + val(cae_1.f) / val(cae_1.e)', async () => {
      expect(
        indicateurValeurExpressionParserService.parseAndEvaluateExpression(
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
        indicateurValeurExpressionParserService.parseAndEvaluateExpression(
          'val(cae_1.f) / opt_val(cae_1.e)',
          {
            'cae_1.f': 20,
          }
        )
      ).toEqual(null);
    });

    test('val(cae_1.e) + limite(cae_1.g) + cible(cae_1.h) + val(cae_1.i) with all values', async () => {
      expect(
        indicateurValeurExpressionParserService.parseAndEvaluateExpression(
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
  });
});
