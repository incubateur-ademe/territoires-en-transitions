import { INestApplication } from '@nestjs/common';
import { ImportReferentielService } from '@tet/backend/referentiels/import-referentiel/import-referentiel.service';
import { getTestApp } from '@tet/backend/test';
import { success } from '@tet/backend/utils/result.type';

describe('import-referentiel.service', () => {
  let app: INestApplication;
  let importReferentielService: ImportReferentielService;

  beforeAll(async () => {
    app = await getTestApp();
    importReferentielService = app.get(ImportReferentielService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`Vérifie la validité des formules`, async () => {
    test(`Déclenche une erreur si une formule contient un token non reconnu`, async () => {
      await expect(() =>
        importReferentielService.verifyReferentielExpressions('cae', [
          {
            identifiant: '1.2.3',
            desactivation: 'token non valide',
          },
        ])
      ).rejects.toThrow(
        [
          "L'expression de désactivation de l'action cae_1.2.3 contient une erreur de syntaxe (ligne 1, colonne 7) :",
          '  token non valide',
          '        ^^^',
          "Texte inattendu après la fin de l'expression : « non ».",
        ].join('\n')
      );
    });

    test(`Déclenche une erreur si une formule contient un argument de fonction manquant`, async () => {
      await expect(() =>
        importReferentielService.verifyReferentielExpressions('cae', [
          {
            identifiant: '1.2.3',
            reduction: 'score()',
          },
        ])
      ).rejects.toThrow(
        [
          "L'expression de réduction de l'action cae_1.2.3 contient une erreur de syntaxe (ligne 1, colonne 7) :",
          '  score()',
          '        ^',
          'Attendu un identifiant, trouvé « ) ».',
        ].join('\n')
      );
    });

    test(`Déclenche une erreur si une formule contient un opérateur inconnu`, async () => {
      await expect(() =>
        importReferentielService.verifyReferentielExpressions('cae', [
          {
            identifiant: '1.2.3',
            score: '1 -- 2',
          },
        ])
      ).rejects.toThrow(
        /L'expression de score de l'action cae_1.2.3 contient une erreur de syntaxe \(ligne 1, colonne \d+\) :\n {2}1 -- 2\n *\^+\nExpression attendue, trouvé « - »\./
      );
    });

    test(`Déclenche une erreur si une formule contient une erreur de parenthèsage`, async () => {
      await expect(() =>
        importReferentielService.verifyReferentielExpressions('cae', [
          {
            identifiant: '1.2.3',
            exprScore: 'limite(cae_1.b))',
          },
        ])
      ).rejects.toThrow(
        [
          "L'expression de score de l'action cae_1.2.3 contient une erreur de syntaxe (ligne 1, colonne 16) :",
          '  limite(cae_1.b))',
          '                 ^',
          "Texte inattendu après la fin de l'expression : « ) ».",
        ].join('\n')
      );
    });

    test(`Déclenche une erreur si une formule contient une référence à un indicateur inconnu`, async () => {
      await expect(() =>
        importReferentielService.verifyReferentielExpressions('cae', [
          {
            identifiant: '1.2.3',
            exprScore: 'limite(cae_1000)',
          },
        ])
      ).rejects.toThrow(
        'L\'indicateur "cae_1000" référencé dans expression "limite(cae_1000)" de l\'action cae_1.2.3 n\'existe pas'
      );
    });

    test(`Déclenche une erreur si la mesure référence directement un indicateur inconnu`, async () => {
      await expect(() =>
        importReferentielService.verifyReferentielExpressions('cae', [
          {
            identifiant: '1.2.3',
            indicateurs: ['cae_1000'],
          },
        ])
      ).rejects.toThrow(
        "L'indicateur \"cae_1000\" référencé dans liste indicateurs de l'action cae_1.2.3 n'existe pas"
      );
    });

    test(`Déclenche une erreur si une formule contient une référence à une valeur limite non spécifiée`, async () => {
      await expect(() =>
        importReferentielService.verifyReferentielExpressions('cae', [
          {
            identifiant: '1.2.3',
            exprScore: 'limite(cae_1.a) < cible(cae_1.a)',
          },
        ])
      ).rejects.toThrow(
        [
          'L\'expression cible manquante pour l\'indicateur "cae_1.a" utilisé dans l\'expression "limite(cae_1.a) < cible(cae_1.a)" de l\'action cae_1.2.3',
          'L\'expression limite manquante pour l\'indicateur "cae_1.a" utilisé dans l\'expression "limite(cae_1.a) < cible(cae_1.a)" de l\'action cae_1.2.3',
        ].join('\n\n')
      );
    });

    test(`Ne déclenche pas d'erreur si les références aux valeurs cible/limite sont trouvées`, async () => {
      const ret = await importReferentielService.verifyReferentielExpressions(
        'cae',
        [
          {
            identifiant: '1.2.3',
            exprScore: 'limite(cae_36) < cible(cae_39)',
          },
        ]
      );
      expect(ret).toEqual(success(true));
    });
  });

  describe(`Vérifie la validité sémantique des expressions de personnalisation`, () => {
    test(`Déclenche une erreur si une expression reponse() référence une question inexistante`, async () => {
      await expect(() =>
        importReferentielService.verifyReferentielExpressions('cae', [
          {
            identifiant: '1.2.3',
            desactivation: 'reponse(question_inexistante_999, OUI)',
          },
        ])
      ).rejects.toThrow(/question_inexistante_999/);
    });

    test(`Déclenche une erreur si une expression reponse() utilise une valeur invalide pour une question binaire`, async () => {
      await expect(() =>
        importReferentielService.verifyReferentielExpressions('cae', [
          {
            identifiant: '1.2.3',
            desactivation: 'reponse(dechets_1, INVALIDE)',
          },
        ])
      ).rejects.toThrow(/INVALIDE/);
    });

    test(`Déclenche une erreur si identite() utilise un champ invalide`, async () => {
      await expect(() =>
        importReferentielService.verifyReferentielExpressions('cae', [
          {
            identifiant: '1.2.3',
            desactivation: 'identite(champ_invalide, valeur)',
          },
        ])
      ).rejects.toThrow(/champ_invalide/);
    });

    test(`Déclenche une erreur si identite() utilise une valeur invalide pour le champ population`, async () => {
      await expect(() =>
        importReferentielService.verifyReferentielExpressions('cae', [
          {
            identifiant: '1.2.3',
            desactivation: 'identite(population, population_invalide)',
          },
        ])
      ).rejects.toThrow(/population_invalide/);
    });

    test(`Ne déclenche pas d'erreur pour une expression valide reponse(question_existante, OUI)`, async () => {
      const ret = await importReferentielService.verifyReferentielExpressions(
        'cae',
        [
          {
            identifiant: '1.2.3',
            desactivation: 'reponse(dechets_1, OUI)',
          },
        ]
      );
      expect(ret).toEqual(success(true));
    });

    test(`Ne déclenche pas d'erreur pour une expression valide identite(type, commune)`, async () => {
      const ret = await importReferentielService.verifyReferentielExpressions(
        'cae',
        [
          {
            identifiant: '1.2.3',
            desactivation: 'identite(type, commune)',
          },
        ]
      );
      expect(ret).toEqual(success(true));
    });
  });
});
