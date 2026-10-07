import { UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import ListPersonnalisationQuestionsService from '@tet/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.service';
import PersonnalisationsExpressionService from '@tet/backend/collectivites/personnalisations/services/personnalisations-expression.service';
import ImportIndicateurDefinitionService from '@tet/backend/indicateurs/import-indicateurs/import-indicateur-definition.service';
import CrudValeursService from '@tet/backend/indicateurs/valeurs/crud-valeurs.service';
import IndicateurExpressionService from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import SheetService from '@tet/backend/utils/google-sheets/sheet.service';
import VersionService from '@tet/backend/utils/version/version.service';
import { cloneDeep } from 'es-toolkit';
import { DatabaseService } from '../../utils/database/database.service';
import { ListPlatformDefinitionsRepository } from '../definitions/list-platform-definitions/list-platform-definitions.repository';
import {
  sampleImportIndicateurDefinition,
  sampleImportIndicateurDefinition2,
} from './samples/import-indicateur-definition.sample';

describe('Indicateurs → import-indicateur-definition.service', () => {
  let importIndicateurDefinitionService: ImportIndicateurDefinitionService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ImportIndicateurDefinitionService,
        IndicateurExpressionService,
        PersonnalisationsExpressionService,
        VersionService,
      ],
    })
      .useMocker((token) => {
        if (token === ListPersonnalisationQuestionsService) {
          return {
            listQuestionsWithChoices: async () => [
              { id: 'dechets_1', type: 'binaire', choix: [] },
            ],
          };
        }
        if (
          token === DatabaseService ||
          token === ConfigurationService ||
          token === ListPlatformDefinitionsRepository ||
          token === SheetService ||
          token === CrudValeursService
        ) {
          return {};
        }
      })
      .compile();

    importIndicateurDefinitionService = moduleRef.get(
      ImportIndicateurDefinitionService
    );
  });

  describe('checkIndicateurDefinitions', () => {
    test('Formula which reference itself', async () => {
      const indicateurDefinition = cloneDeep(sampleImportIndicateurDefinition);
      indicateurDefinition.valeurCalcule = `val(${indicateurDefinition.identifiantReferentiel}) + val(cae_1.b)`;

      await expect(async () =>
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          indicateurDefinition,
        ])
      ).rejects.toThrowError(/cannot depend on itself/i);
    });

    test('Unknown indicateur', async () => {
      const indicateurDefinition = cloneDeep(sampleImportIndicateurDefinition);
      indicateurDefinition.valeurCalcule = `val(cae_1.b) / 10`;

      await expect(async () =>
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          indicateurDefinition,
        ])
      ).rejects.toThrowError(/unknown indicateur cae_1.b/i);
    });

    test('Circular dependency', async () => {
      const indicateurDefinition = cloneDeep(sampleImportIndicateurDefinition);
      const indicateurDefinition2 = cloneDeep(
        sampleImportIndicateurDefinition2
      );
      indicateurDefinition.valeurCalcule = `val(${indicateurDefinition2.identifiantReferentiel}) / 10`;
      indicateurDefinition2.valeurCalcule = `val(${indicateurDefinition.identifiantReferentiel}) * 10`;

      await expect(async () =>
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          indicateurDefinition,
          indicateurDefinition2,
        ])
      ).rejects.toThrowError(/circular dependency/i);
    });

    test('Everything ok', async () => {
      const indicateurDefinition = cloneDeep(sampleImportIndicateurDefinition);
      const indicateurDefinition2 = cloneDeep(
        sampleImportIndicateurDefinition2
      );
      indicateurDefinition.valeurCalcule = `val(${indicateurDefinition2.identifiantReferentiel}) / 10`;

      await expect(
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          indicateurDefinition,
          indicateurDefinition2,
        ])
      ).resolves.toBeUndefined();
    });

    test('Expression cible avec referentiel(te) valide', async () => {
      const indicateurDefinition = cloneDeep(sampleImportIndicateurDefinition);
      indicateurDefinition.exprCible = 'si referentiel(te) alors 20 sinon 10';

      await expect(
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          indicateurDefinition,
        ])
      ).resolves.toBeUndefined();
    });

    test('Expression cible avec referentiel inconnu', async () => {
      const indicateurDefinition = cloneDeep(sampleImportIndicateurDefinition);
      indicateurDefinition.exprCible = 'si referentiel(xx) alors 20 sinon 10';

      await expect(
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          indicateurDefinition,
        ])
      ).rejects.toThrow(
        // erreur sans position : la formule est recopiée
        `L'expression cible de l'indicateur cae_1.a "si referentiel(xx) alors 20 sinon 10" est invalide : `
      );
      await expect(
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          indicateurDefinition,
        ])
      ).rejects.toThrow(/référentiel "xx" inconnu/i);
    });

    test('Expression cible avec caractère non reconnu', async () => {
      const indicateurDefinition = cloneDeep(sampleImportIndicateurDefinition);
      indicateurDefinition.exprCible =
        'si identite(sinoe, rural_dispersé) alors 20 sinon 10';

      const promise =
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          indicateurDefinition,
        ]);
      await expect(promise).rejects.toThrow(UnprocessableEntityException);
      await expect(promise).rejects.toThrow(/caractère non reconnu « é »/i);
    });

    test('Expression cible avec erreur de syntaxe : extrait sans recopie de la formule', async () => {
      const indicateurDefinition = cloneDeep(sampleImportIndicateurDefinition);
      indicateurDefinition.exprCible =
        'si identite(sinoe, dense) alors 280\nsinon si dentite(sinoe, touristique) alors 300\nsinon 380';

      await expect(
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          indicateurDefinition,
        ])
      ).rejects.toThrow(
        [
          "L'expression cible de l'indicateur cae_1.a est invalide (ligne 2, colonne 10) :",
          '  sinon si dentite(sinoe, touristique) alors 300',
          '           ^^^^^^^',
          'Fonction inconnue « dentite ». Vouliez-vous dire « identite » ?',
        ].join('\n')
      );
    });

    test('Formule de calcul avec erreur de syntaxe : libellé en français', async () => {
      const indicateurDefinition = cloneDeep(sampleImportIndicateurDefinition);
      indicateurDefinition.valeurCalcule = 'val(cae_1.b) +';

      await expect(
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          indicateurDefinition,
          cloneDeep(sampleImportIndicateurDefinition2),
        ])
      ).rejects.toThrow(
        /^L'expression de calcul de l'indicateur cae_1\.a est invalide \(ligne 1, colonne \d+\) :\n {2}val\(cae_1\.b\) \+\n/
      );
    });

    test('Expression seuil avec version mal formée', async () => {
      const indicateurDefinition = cloneDeep(sampleImportIndicateurDefinition);
      indicateurDefinition.exprSeuil =
        'si referentiel(te_9.9) alors 20 sinon 10';

      await expect(
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          indicateurDefinition,
        ])
      ).rejects.toThrow(/version "9\.9" invalide/i);
    });

    test('Expression cible avec une typologie SINOE mal orthographiée', async () => {
      const indicateurDefinition = cloneDeep(sampleImportIndicateurDefinition);
      indicateurDefinition.exprCible =
        'si identite(sinoe, touristqiue) alors 300 sinon 100';

      const promise =
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          indicateurDefinition,
        ]);
      await expect(promise).rejects.toThrow(UnprocessableEntityException);
      await expect(promise).rejects.toThrow(
        /"touristqiue" pour identite\(sinoe\) dans l'expression cible de l'indicateur cae_1\.a/
      );
    });

    test('Expression seuil avec une question inexistante', async () => {
      const indicateurDefinition = cloneDeep(sampleImportIndicateurDefinition);
      indicateurDefinition.exprSeuil =
        'si reponse(question_inexistante, oui) alors 20 sinon 10';

      const promise =
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          indicateurDefinition,
        ]);
      await expect(promise).rejects.toThrow(UnprocessableEntityException);
      await expect(promise).rejects.toThrow(
        /question "question_inexistante" utilisée dans l'expression seuil .*importez les questions de personnalisation avant les indicateurs/
      );
    });

    test('Expression cible avec une question existante', async () => {
      const indicateurDefinition = cloneDeep(sampleImportIndicateurDefinition);
      indicateurDefinition.exprCible =
        'si reponse(dechets_1, oui) alors 20 sinon 10';

      await expect(
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          indicateurDefinition,
        ])
      ).resolves.toBeUndefined();
    });

    test('Les erreurs de plusieurs indicateurs sont réunies dans un seul message', async () => {
      const indicateurDefinition = cloneDeep(sampleImportIndicateurDefinition);
      const indicateurDefinition2 = cloneDeep(
        sampleImportIndicateurDefinition2
      );
      indicateurDefinition.exprCible = 'si identite(typ, commune) alors 1';
      indicateurDefinition2.exprSeuil = 'si demarche(inconnu) alors 1';

      const promise =
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          indicateurDefinition,
          indicateurDefinition2,
        ]);
      await expect(promise).rejects.toThrow(
        /indicateur cae_1\.a[\s\S]*\n[\s\S]*indicateur cae_1\.b/
      );
    });

    test('Formule de calcul avec une valeur de population inconnue', async () => {
      const indicateurDefinition = cloneDeep(sampleImportIndicateurDefinition);
      const indicateurDefinition2 = cloneDeep(
        sampleImportIndicateurDefinition2
      );
      indicateurDefinition2.valeurCalcule = `si identite(population, inconnue) alors val(${indicateurDefinition.identifiantReferentiel}) sinon 0`;

      const promise =
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          indicateurDefinition,
          indicateurDefinition2,
        ]);
      await expect(promise).rejects.toThrow(UnprocessableEntityException);
      await expect(promise).rejects.toThrow(
        /"inconnue" pour identite\(population\) dans la formule de calcul de l'indicateur cae_1\.b/
      );
    });
  });
});
