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
  });
});
