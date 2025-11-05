import { ImportActionDefinitionType } from '@/backend/referentiels/import-referentiel/import-action-definition.dto';
import { DatabaseService } from '@/backend/utils/database/database.service';
import SheetService from '@/backend/utils/google-sheets/sheet.service';
import { ReferentielIdEnum } from '@/domain/referentiels';
import { Test } from '@nestjs/testing';
import { ImportPreuveReglementaireDefinition } from './import-preuve-reglementaire-definition.dto';
import ImportPreuveReglementaireDefinitionService from './import-preuve-reglementaire-definition.service';

// Mock actions for testing
const mockActions: ImportActionDefinitionType[] = [
  {
    identifiant: '1.1.1',
    referentiel: 'eci',
    nom: 'Test Action 1',
  },
  {
    identifiant: '1.1.2',
    referentiel: 'eci',
    nom: 'Test Action 2',
  },
  {
    identifiant: '2.1.1',
    referentiel: 'eci',
    nom: 'Test Action 3',
  },
] as ImportActionDefinitionType[];

describe('ImportPreuveReglementaireDefinitionService', () => {
  let service: ImportPreuveReglementaireDefinitionService;

  beforeAll(async () => {
    // Create a minimal instance for testing the pure function
    const moduleRef = await Test.createTestingModule({
      providers: [ImportPreuveReglementaireDefinitionService],
    })
      .useMocker((token) => {
        if (token === DatabaseService || token === SheetService) {
          return {};
        }
      })
      .compile();
    service = moduleRef.get(ImportPreuveReglementaireDefinitionService);
  });

  describe('verifyReferentielPreuveReglementaireDefinitionsAndActionRelationsWithData', () => {
    it('should validate successfully with valid preuve definitions and action references', () => {
      const preuveDefinitions: ImportPreuveReglementaireDefinition[] = [
        {
          id: 'preuve_1',
          nom: 'Preuve 1',
          description: 'Description 1',
          actions: ['eci_1.1.1', 'eci_1.1.2'],
        },
        {
          id: 'preuve_2',
          nom: 'Preuve 2',
          description: 'Description 2',
          actions: ['eci_2.1.1'],
        },
      ];

      expect(() =>
        service.verifyReferentielPreuveReglementaireDefinitionsAndActionRelationsWithData(
          ReferentielIdEnum.ECI,
          mockActions,
          preuveDefinitions
        )
      ).not.toThrow();
    });

    it('should throw error for duplicate preuve id', () => {
      const preuveDefinitions: ImportPreuveReglementaireDefinition[] = [
        {
          id: 'preuve_1',
          nom: 'Preuve 1',
          description: 'Description 1',
          actions: ['eci_1.1.1'],
        },
        {
          id: 'preuve_1',
          nom: 'Preuve 1 Duplicate',
          description: 'Description 1 Duplicate',
          actions: ['eci_1.1.2'],
        },
      ];

      expect(() =>
        service.verifyReferentielPreuveReglementaireDefinitionsAndActionRelationsWithData(
          ReferentielIdEnum.ECI,
          mockActions,
          preuveDefinitions
        )
      ).toThrow('Duplicate preuve id preuve_1');
    });

    it('should throw error for invalid action reference', () => {
      const preuveDefinitions: ImportPreuveReglementaireDefinition[] = [
        {
          id: 'preuve_1',
          nom: 'Preuve 1',
          description: 'Description 1',
          actions: ['eci_9.9.9'], // Non-existent action
        },
      ];

      expect(() =>
        service.verifyReferentielPreuveReglementaireDefinitionsAndActionRelationsWithData(
          ReferentielIdEnum.ECI,
          mockActions,
          preuveDefinitions
        )
      ).toThrow('Invalid action reference eci_9.9.9 for preuve preuve_1');
    });
  });
});
