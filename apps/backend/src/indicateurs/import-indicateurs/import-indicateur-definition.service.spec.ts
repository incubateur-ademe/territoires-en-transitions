import { Test } from '@nestjs/testing';
import ImportIndicateurDefinitionService from '@tet/backend/indicateurs/import-indicateurs/import-indicateur-definition.service';
import CrudValeursService from '@tet/backend/indicateurs/valeurs/crud-valeurs.service';
import IndicateurExpressionService from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import SheetService from '@tet/backend/utils/google-sheets/sheet.service';
import VersionService from '@tet/backend/utils/version/version.service';
import { cloneDeep } from 'es-toolkit';
import { DatabaseService } from '../../utils/database/database.service';
import { ListDefinitionsService } from '../definitions/list-definitions/list-definitions.service';
import { ListDefinitionsLightRepository } from '../definitions/list-platform-predefined-definitions/list-definitions-light.repository';
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
        VersionService,
      ],
    })
      .useMocker((token) => {
        if (
          token === DatabaseService ||
          token === ConfigurationService ||
          token === ListDefinitionsService ||
          token === ListDefinitionsLightRepository ||
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
  });
});
