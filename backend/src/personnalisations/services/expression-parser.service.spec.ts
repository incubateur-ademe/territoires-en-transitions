import { Test } from '@nestjs/testing';
import {
  CollectivitePopulationTypeEnum,
  CollectiviteTypeEnum,
} from '../../collectivites/models/collectivite.models';
import ExpressionParserService from './expression-parser.service';

describe('ExpressionParserService', () => {
  let expressionParserService: ExpressionParserService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ExpressionParserService],
    })
      .useMocker((token) => {})
      .compile();

    expressionParserService = moduleRef.get(ExpressionParserService);
  });

  describe('parseAndEvaluateExpression', () => {
    it('si VRAI alors 2', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression('si VRAI alors 2'),
      ).toBe(2);
    });

    it('si FAUX alors 2', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression('si FAUX alors 2'),
      ).toBe(null);
    });

    it('si vrai alors 2 sinon si faux alors 4 sinon 8', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression(
          'si vrai alors 2 sinon si faux alors 4 sinon 8',
        ),
      ).toBe(2);
    });

    it('si faux alors 2 sinon si vrai alors 4 sinon 8', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression(
          'si faux alors 2 sinon si vrai alors 4 sinon 8',
        ),
      ).toBe(4);
    });

    it('si faux alors 2 sinon si faux alors 4 sinon 8', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression(
          'si faux alors 2 sinon si faux alors 4 sinon 8',
        ),
      ).toBe(8);
    });

    it('vrai ou faux', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression('vrai ou faux'),
      ).toBe(true);
    });

    it('vrai ou faux', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression('faux ou vrai'),
      ).toBe(true);
    });

    it('vrai ou vrai', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression('vrai ou vrai'),
      ).toBe(true);
    });

    it('faux ou faux', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression('faux ou faux'),
      ).toBe(false);
    });

    it('2 + 3', async () => {
      expect(expressionParserService.parseAndEvaluateExpression('2 + 3')).toBe(
        2 + 3,
      );
    });

    it('3 + 2', async () => {
      expect(expressionParserService.parseAndEvaluateExpression('3 + 2')).toBe(
        3 + 2,
      );
    });

    it('2 -3', async () => {
      expect(expressionParserService.parseAndEvaluateExpression('2 -3')).toBe(
        2 - 3,
      );
    });

    it('3 - 2', async () => {
      expect(expressionParserService.parseAndEvaluateExpression('3 - 2')).toBe(
        3 - 2,
      );
    });

    it('2 * 3', async () => {
      expect(expressionParserService.parseAndEvaluateExpression('2 * 3')).toBe(
        2 * 3,
      );
    });

    it('3 * 2', async () => {
      expect(expressionParserService.parseAndEvaluateExpression('3 * 2')).toBe(
        3 * 2,
      );
    });

    it('2 / 3', async () => {
      expect(expressionParserService.parseAndEvaluateExpression('2 / 3')).toBe(
        2 / 3,
      );
    });

    it('3 / 2', async () => {
      expect(expressionParserService.parseAndEvaluateExpression('3 / 2')).toBe(
        3 / 2,
      );
    });

    it('1 + 2 * 3 + 4', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression('1 + 2 * 3 + 4'),
      ).toBe(1 + 2 * 3 + 4);
    });

    it('1 + 5 - 4', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression('1 + 5 - 4'),
      ).toBe(1 + 5 - 4);
    });

    it('1 - 2 * 3 + 4', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression('1 - 2 * 3 + 4'),
      ).toBe(1 - 2 * 3 + 4);
    });

    it('1 + 2 * 3 - 4', async () => {
      // Voir https://tomo.dev/en/posts/sample-formula-parser-using-chevrotain/ pour bien gérer ce cas
      expect(
        expressionParserService.parseAndEvaluateExpression('1 + 2 * 3 - 4'),
      ).toBe(1 + 2 * 3 - 4);
    });

    it('3 + 4 * 5 / 2', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression('3 + 4 * 5 / 2'),
      ).toBe(3 + (4 * 5) / 2);
    });

    it('max(2, 3)', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression('max(2, 3)'),
      ).toBe(Math.max(2, 3));
    });

    it('max(3, 2)', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression('max(3, 2)'),
      ).toBe(Math.max(3, 2));
    });

    it('min(2, 3)', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression('min(2, 3)'),
      ).toBe(Math.min(2, 3));
    });

    it('min(3, 2)', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression('min(3, 2)'),
      ).toBe(Math.min(3, 2));
    });

    it('reponse(question_proportion) - 0.2', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression(
          'reponse(question_proportion) - 0.2',
          {
            question_proportion: 1,
          },
        ),
      ).toBe(0.8);
    });

    it('score(eci_1) - 0.2', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression(
          'score(eci_1) - 0.2',
          null,
          null,
          {
            eci_1: 1,
          },
        ),
      ).toBe(0.8);
    });

    it('score(eci_1) - 0.2 without evaluation', async () => {
      expect(
        expressionParserService.parseAndEvaluateExpression(
          'score(eci_1) - 0.2',
          null,
          null,
          null,
        ),
      ).toBe('score(eci_1) - 0.2');
    });

    it('Règle cae_1.2.3', async () => {
      /*
    Pour une collectivité ne possédant que **partiellement**
    les compétences collecte, traitement des déchets et plan de prévention des déchets,
    le score de la 1.2.3 est réduit de 25 %.

    Pour une collectivité n'ayant **aucune**
    les compétences collecte, traitement des déchets et plan de prévention des déchets,
    le score de la 1.2.3 est réduit à 2 points.
    */

      const expression = `si reponse(dechets_1, OUI) et reponse(dechets_2, OUI) et reponse(dechets_3, OUI) alors 1.0 
sinon si reponse(dechets_1, NON) et reponse(dechets_2, NON) et reponse(dechets_3, NON) alors 2/12 
sinon 0.75`;
      expect(() =>
        expressionParserService.parseAndEvaluateExpression(expression),
      ).toThrow(new Error('Reponse à la question dechets_1 non trouvée'));

      expect(
        expressionParserService.parseAndEvaluateExpression(expression, {
          dechets_1: true,
          dechets_2: true,
          dechets_3: true,
        }),
      ).toBe(1.0);

      expect(
        expressionParserService.parseAndEvaluateExpression(expression, {
          dechets_1: false,
          dechets_2: true,
          dechets_3: true,
        }),
      ).toBe(0.75);

      expect(
        expressionParserService.parseAndEvaluateExpression(expression, {
          dechets_1: true,
          dechets_2: false,
          dechets_3: true,
        }),
      ).toBe(0.75);

      expect(
        expressionParserService.parseAndEvaluateExpression(expression, {
          dechets_1: true,
          dechets_2: true,
          dechets_3: false,
        }),
      ).toBe(0.75);

      expect(
        expressionParserService.parseAndEvaluateExpression(expression, {
          dechets_1: true,
          dechets_2: false,
          dechets_3: false,
        }),
      ).toBe(0.75);

      expect(
        expressionParserService.parseAndEvaluateExpression(expression, {
          dechets_1: false,
          dechets_2: false,
          dechets_3: true,
        }),
      ).toBe(0.75);

      expect(
        expressionParserService.parseAndEvaluateExpression(expression, {
          dechets_1: false,
          dechets_2: false,
          dechets_3: false,
        }),
      ).toBe(2 / 12);
    });

    it('Règle cae_3.1.1', async () => {
      /*
    Pour une collectivité non autorité organisatrice de la distribution d'électricité,
    le score de la 3.1.1 est réduit de 30 %.
    Pour une collectivité non autorité organisatrice de la distribution de gaz,
    le score de la 3.1.1 est réduit de 30 %.
    Pour une collectivité non autorité organisatrice de la distribution de chaleur,
    le score de la 3.1.1 est réduit de 40 %.
    Ces réductions sont cumulables dans la limite de 2 points restants
    pour prendre en compte la part d’influence dans les instances compétentes et les actions partenariales.
    */
      const expression = `si reponse(AOD_elec, OUI) et reponse(AOD_gaz, OUI) et reponse(AOD_chaleur, OUI) alors 1.0 
sinon si reponse(AOD_elec, NON) et reponse(AOD_gaz, NON) et reponse(AOD_chaleur, NON) alors 2/10 
sinon si reponse(AOD_elec, NON) et reponse(AOD_gaz, NON) alors 4/10 
sinon si reponse(AOD_elec, NON) et reponse(AOD_chaleur, NON) alors 3/10 
sinon si reponse(AOD_gaz, NON) et reponse(AOD_chaleur, NON) alors 3/10 
sinon si reponse(AOD_elec, NON) ou reponse(AOD_gaz, NON) alors 7/10 
sinon si reponse(AOD_chaleur, NON) alors 6/10`;

      expect(
        expressionParserService.parseAndEvaluateExpression(expression, {
          AOD_elec: true,
          AOD_gaz: true,
          AOD_chaleur: true,
        }),
      ).toBe(1.0);

      // Electricité seulement
      expect(
        expressionParserService.parseAndEvaluateExpression(expression, {
          AOD_elec: true,
          AOD_gaz: false,
          AOD_chaleur: false,
        }),
      ).toBe(3 / 10);

      // Aucun
      expect(
        expressionParserService.parseAndEvaluateExpression(expression, {
          AOD_elec: false,
          AOD_gaz: false,
          AOD_chaleur: false,
        }),
      ).toBe(2 / 10);

      // Gaz seulement
      expect(
        expressionParserService.parseAndEvaluateExpression(expression, {
          AOD_elec: false,
          AOD_gaz: true,
          AOD_chaleur: false,
        }),
      ).toBe(3 / 10);

      // Chaleur seulement
      expect(
        expressionParserService.parseAndEvaluateExpression(expression, {
          AOD_elec: false,
          AOD_gaz: false,
          AOD_chaleur: true,
        }),
      ).toBe(4 / 10);

      // Chaleur et gaz
      expect(
        expressionParserService.parseAndEvaluateExpression(expression, {
          AOD_elec: false,
          AOD_gaz: true,
          AOD_chaleur: true,
        }),
      ).toBe(7 / 10);

      // Gaz et elec
      expect(
        expressionParserService.parseAndEvaluateExpression(expression, {
          AOD_elec: true,
          AOD_gaz: true,
          AOD_chaleur: false,
        }),
      ).toBe(6 / 10);

      // Chaleur et elec
      expect(
        expressionParserService.parseAndEvaluateExpression(expression, {
          AOD_elec: true,
          AOD_gaz: false,
          AOD_chaleur: true,
        }),
      ).toBe(7 / 10);
    });

    it('Règle cae_3.3.3', async () => {
      /*
     Pour un EPCI, en cas de compétence "assainissement" partagée ou variable sur le territoire,
    la réduction de potentielle est proportionnelle à la part des communes ayant délégué leur compétence assainissement,
    dans la limite de moins 50%.

    Pour les communes sans compétence assainissement,
    le score de la 3.3.3 est réduit de 50 %.
    */
      const expression = `si identite(type, EPCI) alors max(reponse(assainissement_3), 0.5)
sinon si identite(type, commune) et reponse(assainissement_1, NON) et reponse(assainissement_2, NON) alors 0.5`;

      // Une commune avec toutes les compétences
      expect(
        expressionParserService.parseAndEvaluateExpression(
          expression,
          {
            assainissement_1: true,
            assainissement_2: true,
            assainissement_3: 0.7,
          },
          {
            type: CollectiviteTypeEnum.COMMUNE,
            soustype: null,
            population_tags: [CollectivitePopulationTypeEnum.MOINS_DE_20000],
            drom: false,
          },
        ),
      ).toBe(null);

      // Une commune sans aucune compétence
      expect(
        expressionParserService.parseAndEvaluateExpression(
          expression,
          {
            assainissement_1: false,
            assainissement_2: false,
            assainissement_3: 0.7,
          },
          {
            type: CollectiviteTypeEnum.COMMUNE,
            soustype: null,
            population_tags: [CollectivitePopulationTypeEnum.MOINS_DE_20000],
            drom: false,
          },
        ),
      ).toBe(0.5);

      // Un epci avec une part déléguée à 70%
      expect(
        expressionParserService.parseAndEvaluateExpression(
          expression,
          {
            assainissement_1: false,
            assainissement_2: false,
            assainissement_3: 0.7,
          },
          {
            type: CollectiviteTypeEnum.EPCI,
            soustype: null,
            population_tags: [CollectivitePopulationTypeEnum.MOINS_DE_50000],
            drom: false,
          },
        ),
      ).toBe(0.7);

      // Un epci avec une part déléguée à 30%
      expect(
        expressionParserService.parseAndEvaluateExpression(
          expression,
          {
            assainissement_1: false,
            assainissement_2: false,
            assainissement_3: 0.3,
          },
          {
            type: CollectiviteTypeEnum.EPCI,
            soustype: null,
            population_tags: [CollectivitePopulationTypeEnum.MOINS_DE_50000],
            drom: false,
          },
        ),
      ).toBe(0.5);
    });

    it('Règle cae_3.3.5', async () => {
      /*
    Pour une commune, la note est réduite à 2 points.
    Pour un EPCI ayant transféré la compétence traitement des déchets à un syndicat compétent en la matière, la note est réduite proportionnelle à sa participation dans cet syndicat, dans la limite de 2 points restants.
    Pour favoriser la prévention des déchets, la note attribuée à cette action ne peut dépasser celle obtenue dans l'action 1.2.3.
    */
      const expression = `si identite(type, commune) et reponse(dechets_2, NON) alors min(score(cae_1.2.3), 2/12)
sinon si identite (type,EPCI) et reponse(dechets_2, OUI) alors min(score(cae_1.2.3), 1.0)
sinon si identite(type, EPCI) et reponse(dechets_2, NON) alors min(score(cae_1.2.3), max(reponse(dechets_4), 2/12))
`;

      // une commune avec la compétence déchets
      expect(
        expressionParserService.parseAndEvaluateExpression(
          expression,
          {
            dechets_2: true,
          },
          {
            type: CollectiviteTypeEnum.COMMUNE,
            soustype: null,
            population_tags: [CollectivitePopulationTypeEnum.MOINS_DE_20000],
            drom: false,
          },
        ),
      ).toBe(null);

      // une commune sans la compétence déchets
      expect(
        expressionParserService.parseAndEvaluateExpression(
          expression,
          {
            dechets_2: false,
          },
          {
            type: CollectiviteTypeEnum.COMMUNE,
            soustype: null,
            population_tags: [CollectivitePopulationTypeEnum.MOINS_DE_20000],
            drom: false,
          },
        ),
      ).toBe('min(score(cae_1.2.3), 0.16666666666666666)');

      // un epci avec la compétence déchets
      expect(
        expressionParserService.parseAndEvaluateExpression(
          expression,
          {
            dechets_2: true,
          },
          {
            type: CollectiviteTypeEnum.EPCI,
            soustype: null,
            population_tags: [CollectivitePopulationTypeEnum.MOINS_DE_50000],
            drom: false,
          },
        ),
      ).toBe('min(score(cae_1.2.3), 1)');

      // un epci sans la compétence déchets, si réponse à dechets_4
      expect(
        expressionParserService.parseAndEvaluateExpression(
          expression,
          {
            dechets_2: false,
            dechets_4: 1 / 12,
          },
          {
            type: CollectiviteTypeEnum.EPCI,
            soustype: null,
            population_tags: [CollectivitePopulationTypeEnum.MOINS_DE_50000],
            drom: false,
          },
        ),
      ).toBe('min(score(cae_1.2.3), 0.16666666666666666)');
    });

    it('Règle cae_3.2.2', async () => {
      /*
    Le nombre de point max pour l''action 3.2.2 est de 12 points en Métropole et de 10 points pour les collectivités DOM.
    */
      const expression = `si identite(localisation,DOM) alors 10/12`;

      // une commune en métropole
      expect(
        expressionParserService.parseAndEvaluateExpression(
          expression,
          undefined,
          {
            type: CollectiviteTypeEnum.COMMUNE,
            soustype: null,
            population_tags: [CollectivitePopulationTypeEnum.MOINS_DE_20000],
            drom: false,
          },
        ),
      ).toBe(null);

      // une commune dans les DOM
      expect(
        expressionParserService.parseAndEvaluateExpression(
          expression,
          undefined,
          {
            type: CollectiviteTypeEnum.COMMUNE,
            soustype: null,
            population_tags: [CollectivitePopulationTypeEnum.MOINS_DE_20000],
            drom: true,
          },
        ),
      ).toBe(10 / 12);
    });

    it('Règle cae_6.3.1', async () => {
      /*
    Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de développement économique, dans la limite de 2 points de potentiel restant.</p>\n<p>En l’absence de tissu économique propice à l’émergence de projets d’écologie industrielle, le score de la 6.3.1.4 est réduit à 0 et son statut est &quot;non concerné&quot; : les 2 points liés sont affectés à la 6.3.1.3 et la 6.3.1.5.
    */
      const expression = `si identite(type, commune) alors max (reponse(dev_eco_2), 2/8) \n`;

      // une commune en métropole
      expect(
        expressionParserService.parseAndEvaluateExpression(
          expression,
          {
            dev_eco_2: 0,
          },
          {
            type: CollectiviteTypeEnum.COMMUNE,
            soustype: null,
            population_tags: [CollectivitePopulationTypeEnum.MOINS_DE_20000],
            drom: false,
          },
        ),
      ).toBe(2 / 8);

      // Pas de réponse à dev_eco_2
      expect(
        expressionParserService.parseAndEvaluateExpression(
          expression,
          {
            dev_eco_4: false,
          },
          {
            type: CollectiviteTypeEnum.COMMUNE,
            soustype: null,
            population_tags: [CollectivitePopulationTypeEnum.MOINS_DE_20000],
            drom: false,
          },
        ),
      ).toBe(null);
    });
  });
});
