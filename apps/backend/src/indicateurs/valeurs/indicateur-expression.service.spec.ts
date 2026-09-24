import { Test } from '@nestjs/testing';
import {
  CollectiviteSousTypeEnum,
  CollectiviteTypeEnum,
} from '@tet/domain/collectivites';
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

    test('Simple formula with est_suivi', async () => {
      const formula = 'si est_suivi(te_11) alors 1 sinon 0';
      const neededSourceIndicateurs =
        indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          formula
        );
      expect(neededSourceIndicateurs).toEqual([
        { identifiant: 'te_11', optional: true, tokens: ['est_suivi'] },
      ]);
    });

    test('progression_snbc(id) équivaut à progression_snbc(id, 2015)', () => {
      const attendu = [
        {
          identifiant: 'cae_1.a',
          optional: false,
          tokens: ['progression_snbc'],
          progressions: [{ token: 'progression_snbc', anneeDepart: 2015 }],
        },
      ];
      expect(
        indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          'progression_snbc(cae_1.a)'
        )
      ).toEqual(attendu);
      expect(
        indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          'progression_snbc(cae_1.a, 2015)'
        )
      ).toEqual(attendu);
    });

    test('progression_snbc avec année de départ', () => {
      expect(
        indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          'min(1, progression_snbc(cae_1.a, 2019))'
        )
      ).toEqual([
        {
          identifiant: 'cae_1.a',
          optional: false,
          tokens: ['progression_snbc'],
          progressions: [{ token: 'progression_snbc', anneeDepart: 2019 }],
        },
      ]);
    });

    test('reduction à 4 paramètres', () => {
      expect(
        indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          'reduction(cae_1.a, 2015, 2030, 0.4)'
        )
      ).toEqual([
        {
          identifiant: 'cae_1.a',
          optional: false,
          tokens: ['reduction'],
          progressions: [
            {
              token: 'reduction',
              anneeDepart: 2015,
              anneeCible: 2030,
              reductionCible: 0.4,
            },
          ],
        },
      ]);
    });

    test('dédoublonne les progressions identiques et fusionne les autres', () => {
      const [ref] =
        indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
          'progression_snbc(cae_1.a) + progression_snbc(cae_1.a, 2015) + progression_snbc(cae_1.a, 2019) + val(cae_1.a)'
        );
      expect(ref.tokens).toEqual(['progression_snbc', 'val']);
      expect(ref.progressions).toEqual([
        { token: 'progression_snbc', anneeDepart: 2015 },
        { token: 'progression_snbc', anneeDepart: 2019 },
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

  describe('identite(soustype, ...)', () => {
    const formule = 'si identite(soustype, syndicat) alors 1 sinon 0';
    const formuleFP =
      'si identite(soustype, epci_a_fiscalite_propre) alors 1 sinon 0';

    it('identite(soustype, syndicat) retourne 1 pour un syndicat', () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          formule,
          { dummy: 1 },
          {
            identiteCollectivite: {
              type: CollectiviteTypeEnum.EPCI,
              soustype: CollectiviteSousTypeEnum.SYNDICAT,
              populationTags: [],
              drom: false,
            },
          }
        )
      ).toBe(1);
    });

    it('identite(soustype, epci_a_fiscalite_propre) retourne 1 pour un EPCI FP', () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          formuleFP,
          { dummy: 1 },
          {
            identiteCollectivite: {
              type: CollectiviteTypeEnum.EPCI,
              soustype: CollectiviteSousTypeEnum.EPCI_FP,
              populationTags: [],
              drom: false,
            },
          }
        )
      ).toBe(1);
    });

    it('identite(soustype, pole) retourne 1 pour un pole', () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          'si identite(soustype, pole) alors 1 sinon 0',
          { dummy: 1 },
          {
            identiteCollectivite: {
              type: CollectiviteTypeEnum.EPCI,
              soustype: CollectiviteSousTypeEnum.POLE,
              populationTags: [],
              drom: false,
            },
          }
        )
      ).toBe(1);
    });

    it('identite(soustype, syndicat) retourne 0 pour une commune', () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          formule,
          { dummy: 1 },
          {
            identiteCollectivite: {
              type: CollectiviteTypeEnum.COMMUNE,
              soustype: null,
              populationTags: [],
              drom: false,
            },
          }
        )
      ).toBe(0);
    });

    it('identite(soustype, SYNDICAT) en majuscules retourne 1 (insensible a la casse)', () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          'si identite(soustype, SYNDICAT) alors 1 sinon 0',
          { dummy: 1 },
          {
            identiteCollectivite: {
              type: CollectiviteTypeEnum.EPCI,
              soustype: CollectiviteSousTypeEnum.SYNDICAT,
              populationTags: [],
              drom: false,
            },
          }
        )
      ).toBe(1);
    });
  });

  describe('est_suivi(...)', () => {
    const formule = 'si est_suivi(te_11) alors 1 sinon 0';

    it("retourne 1 quand l'indicateur est suivi", () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          formule,
          {},
          { indicateursSuivis: { te_11: true } }
        )
      ).toBe(1);
    });

    it("retourne 0 quand l'indicateur n'est pas suivi", () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          formule,
          {},
          { indicateursSuivis: { te_11: false } }
        )
      ).toBe(0);
    });

    it("retourne 0 quand l'indicateur est absent du contexte (indicateur inconnu/non applicable)", () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          formule,
          {},
          { indicateursSuivis: {} }
        )
      ).toBe(0);
    });

    it('peut être combiné avec val() dans la même formule', () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(
          'si est_suivi(te_11) alors val(te_11) sinon 0',
          { te_11: 42 },
          { indicateursSuivis: { te_11: true } }
        )
      ).toBe(42);
    });

    it('retourne 0 si aucun contexte indicateursSuivis fourni (ne bloque jamais le calcul)', () => {
      expect(
        indicateurExpressionService.parseAndEvaluateExpression(formule, {
          dummy: 1,
        })
      ).toBe(0);
    });
  });

  describe('progression_snbc(...) et reduction(...)', () => {
    const evaluate = (
      formule: string,
      valeur: number | null,
      context?: Parameters<
        IndicateurExpressionService['parseAndEvaluateExpression']
      >[2]
    ) =>
      indicateurExpressionService.parseAndEvaluateExpression(
        formule,
        { cae_1: valeur } as Record<string, number>,
        context
      );

    const snbc = {
      anneesUtilisees: { cae_1: 2025 },
      valeursProgression: {
        cae_1: {
          2015: { objectifSnbc: 100 },
          2025: { objectifSnbc: 80 },
        },
      },
    };

    it('progression_snbc nominal', () => {
      expect(evaluate('progression_snbc(cae_1)', 90, snbc)).toBe(0.5);
    });

    it('progression_snbc(id) équivaut à progression_snbc(id, 2015)', () => {
      expect(evaluate('progression_snbc(cae_1, 2015)', 90, snbc)).toBe(0.5);
    });

    it('progression_snbc avec une autre année de départ', () => {
      expect(
        evaluate('progression_snbc(cae_1, 2019)', 90, {
          ...snbc,
          valeursProgression: {
            cae_1: { 2019: { objectifSnbc: 200 }, 2025: { objectifSnbc: 100 } },
          },
        })
      ).toBe(1.1);
    });

    it('progression_snbc renvoie null sans année utilisée (calcul programme)', () => {
      expect(
        evaluate('progression_snbc(cae_1)', 90, {
          valeursProgression: snbc.valeursProgression,
        })
      ).toBeNull();
    });

    it('progression_snbc renvoie null si valeur ou objectif manque', () => {
      expect(evaluate('progression_snbc(cae_1)', null, snbc)).toBeNull();
      expect(
        evaluate('progression_snbc(cae_1)', 90, {
          ...snbc,
          valeursProgression: { cae_1: { 2015: { objectifSnbc: 100 } } },
        })
      ).toBeNull();
    });

    it('progression_snbc renvoie null si valeurDepart = valeurAttendue, même sous min(1, ...)', () => {
      const context = {
        ...snbc,
        valeursProgression: {
          cae_1: { 2015: { objectifSnbc: 80 }, 2025: { objectifSnbc: 80 } },
        },
      };
      expect(evaluate('progression_snbc(cae_1)', 90, context)).toBeNull();
      expect(
        evaluate('min(1, progression_snbc(cae_1))', 90, context)
      ).toBeNull();
    });

    describe('reduction', () => {
      const formule = 'reduction(cae_1, 2015, 2030, 0.4)';
      const context = {
        anneesUtilisees: { cae_1: 2025 },
        valeursProgression: { cae_1: { 2015: { resultatDepart: 100 } } },
      };

      it('nominal', () => {
        expect(evaluate(formule, 90, context)).toBeCloseTo(0.375);
      });

      it('est bornée à la cible après anneeCible', () => {
        expect(
          evaluate(formule, 80, {
            ...context,
            anneesUtilisees: { cae_1: 2040 },
          })
        ).toBe(0.5);
      });

      it('renvoie null à anneeDepart ou avant', () => {
        expect(
          evaluate(formule, 90, {
            ...context,
            anneesUtilisees: { cae_1: 2015 },
          })
        ).toBeNull();
        expect(
          evaluate(formule, 90, {
            ...context,
            anneesUtilisees: { cae_1: 2010 },
          })
        ).toBeNull();
      });

      it('renvoie null si anneeCible <= anneeDepart', () => {
        expect(
          evaluate('reduction(cae_1, 2015, 2015, 0.4)', 90, context)
        ).toBeNull();
      });

      it('renvoie null si valeurDepart est introuvable ou sans année utilisée', () => {
        expect(
          evaluate(formule, 90, { ...context, valeursProgression: {} })
        ).toBeNull();
        expect(
          evaluate(formule, 90, {
            valeursProgression: context.valeursProgression,
          })
        ).toBeNull();
      });
    });
  });

  describe("messages d'erreur pour identite()", () => {
    it('lance une erreur avec les enums type et soustype pour un champ inconnu', () => {
      expect(() =>
        indicateurExpressionService.parseAndEvaluateExpression(
          'si identite(inconnu, EPCI) alors 1 sinon 0',
          { dummy: 1 },
          {
            identiteCollectivite: {
              type: CollectiviteTypeEnum.EPCI,
              soustype: CollectiviteSousTypeEnum.EPCI_FP,
              populationTags: [],
              drom: false,
            },
          }
        )
      ).toThrow(
        'Champ d\'identité "inconnu" non reconnu dans identite(inconnu, EPCI). ' +
          'Champs autorisés : type, soustype, population, localisation, dans_aire_urbaine, commune_membre.'
      );
    });
  });
});
