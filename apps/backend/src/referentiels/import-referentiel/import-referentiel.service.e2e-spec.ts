import { ImportReferentielService } from '@/backend/referentiels/import-referentiel/import-referentiel.service';
import { getTestApp } from '@/backend/test';
import { INestApplication } from '@nestjs/common';

describe('import-referentiel.service', () => {
  let app: INestApplication;
  let importReferentielService: ImportReferentielService;

  beforeAll(async () => {
    app = await getTestApp();
    importReferentielService = app.get(ImportReferentielService);

    return async () => {
      await app.close();
    };
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
        'Invalid desactivation expression "token non valide" for action cae_1.2.3: NotAllInputParsedException: Redundant input, expecting EOF but found: non (1:7 --> 1:9)'
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
        `Invalid reduction expression "score()" for action cae_1.2.3: MismatchedTokenException: Expecting token of type --> CNAME <-- but found --> ')' <-- (1:7)`
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
        /Invalid score expression "1 -- 2" for action cae_1.2.3: NoViableAltException: Expecting: one of these possible Token sequences:.*/
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
        'Invalid score expression "limite(cae_1.b))" for action cae_1.2.3: NotAllInputParsedException: Redundant input, expecting EOF but found: ) (1:16)'
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
        'Missing indicateurs: "cae_1000" into expression "limite(cae_1000)" of action cae_1.2.3'
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
          'Missing value/expression "cible" for indicateur "cae_1.a" used into expression "limite(cae_1.a) < cible(cae_1.a)" of action cae_1.2.3',
          'Missing value/expression "limite" for indicateur "cae_1.a" used into expression "limite(cae_1.a) < cible(cae_1.a)" of action cae_1.2.3',
        ].join('\n')
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
      expect(ret).toBe(true);
    });
  });
});
