import { Test } from '@nestjs/testing';
import DatabaseService from '../../common/services/database.service';
import ExpressionParserService from '../../personnalisations/services/expression-parser.service';
import SheetService from '../../spreadsheets/services/sheet.service';
import ConfigurationService from '../../utils/config/configuration.service';
import { ActionDefinitionAvecParentType } from '../models/action-definition.table';
import { CreateActionOrigineType } from '../models/action-origine.table';
import { ActionType } from '../models/action-type.enum';
import { ReferentielActionType } from '../models/referentiel-action.dto';
import { ReferentielDefinitionType } from '../models/referentiel-definition.table';
import { ReferentielType } from '../models/referentiel.enum';
import ReferentielsService from './referentiels.service';

describe('ReferentielsService', () => {
  let referentielsService: ReferentielsService;
  let refentielDefinitions: ReferentielDefinitionType[];

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ReferentielsService],
    })
      .useMocker((token) => {
        if (
          token === DatabaseService ||
          token === ConfigurationService ||
          token === SheetService ||
          token === ExpressionParserService
        ) {
          return {};
        }
      })
      .compile();

    referentielsService = moduleRef.get(ReferentielsService);
    refentielDefinitions = [
      {
        id: 'eci',
        nom: 'Economie circulaire',
        version: '1.0.0',
        hierarchie: [
          ActionType.REFERENTIEL,
          ActionType.AXE,
          ActionType.ACTION,
          ActionType.SOUS_ACTION,
          ActionType.TACHE,
        ],
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      },
      {
        id: 'cae',
        nom: 'Climat air energie',
        version: '1.0.0',
        hierarchie: [
          ActionType.REFERENTIEL,
          ActionType.AXE,
          ActionType.SOUS_AXE,
          ActionType.ACTION,
          ActionType.SOUS_ACTION,
          ActionType.TACHE,
        ],
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      },
    ];
  });

  describe('buildReferentielTree', () => {
    it('une tache réglementaire', async () => {
      const actionDefinitions: ActionDefinitionAvecParentType[] = [
        {
          actionId: 'eci',
          parentActionId: null,
        },
        {
          actionId: 'eci_1',
          parentActionId: 'eci',
          points: 30,
        },
        {
          actionId: 'eci_1.0',
          parentActionId: 'eci_1',
          pourcentage: 0,
        },
        {
          actionId: 'eci_1.1',
          parentActionId: 'eci_1',
        },
        {
          actionId: 'eci_1.2',
          parentActionId: 'eci_1',
        },
        {
          actionId: 'eci_2',
          parentActionId: 'eci',
          points: 70,
        },
        {
          actionId: 'eci_2.1',
          parentActionId: 'eci_2',
          pourcentage: 20,
        },
        {
          actionId: 'eci_2.2',
          parentActionId: 'eci_2',
          pourcentage: 30,
        },
        {
          actionId: 'eci_2.3',
          parentActionId: 'eci_2',
          pourcentage: 50,
        },
      ];
      const orderedActionTypes: ActionType[] = [
        ActionType.REFERENTIEL,
        ActionType.ACTION,
        ActionType.SOUS_ACTION,
        ActionType.TACHE,
      ];
      const referentielTree = referentielsService.buildReferentielTree(
        actionDefinitions,
        orderedActionTypes
      );

      const expectedActionEnfant: ReferentielActionType = {
        actionId: 'eci',
        points: 100,
        level: 0,
        actionType: ActionType.REFERENTIEL,
        actionsEnfant: [
          {
            actionId: 'eci_1',
            points: 30,
            pourcentage: 30,
            level: 1,
            actionType: ActionType.ACTION,
            actionsEnfant: [
              {
                actionId: 'eci_1.0',
                points: 0,
                pourcentage: 0,
                level: 2,
                actionType: ActionType.SOUS_ACTION,
                actionsEnfant: [],
                tags: [],
              },
              {
                actionId: 'eci_1.1',
                points: 15,
                pourcentage: 50,
                level: 2,
                actionType: ActionType.SOUS_ACTION,
                actionsEnfant: [],
                tags: [],
              },
              {
                actionId: 'eci_1.2',
                points: 15,
                pourcentage: 50,
                level: 2,
                actionType: ActionType.SOUS_ACTION,
                actionsEnfant: [],
                tags: [],
              },
            ],
            tags: [],
          },
          {
            actionId: 'eci_2',
            points: 70,
            pourcentage: 70,
            level: 1,
            actionType: ActionType.ACTION,
            actionsEnfant: [
              {
                actionId: 'eci_2.1',
                points: 14,
                pourcentage: 20,
                level: 2,
                actionType: ActionType.SOUS_ACTION,
                actionsEnfant: [],
                tags: [],
              },
              {
                actionId: 'eci_2.2',
                points: 21,
                pourcentage: 30,
                level: 2,
                actionType: ActionType.SOUS_ACTION,
                actionsEnfant: [],
                tags: [],
              },
              {
                actionId: 'eci_2.3',
                points: 35,
                pourcentage: 50,
                level: 2,
                actionType: ActionType.SOUS_ACTION,
                actionsEnfant: [],
                tags: [],
              },
            ],
            tags: [],
          },
        ],
        tags: [],
      };

      expect(referentielTree).toEqual(expectedActionEnfant);
    });
  });

  describe('getLevelFromActionId', () => {
    it('Standard action', async () => {
      expect(referentielsService.getLevelFromActionId('cae_5.1.4.4.1')).toEqual(
        5
      );
    });

    it('Axe', async () => {
      expect(referentielsService.getLevelFromActionId('cae_5')).toEqual(1);
    });

    it('Referentiel', async () => {
      expect(referentielsService.getLevelFromActionId('cae')).toEqual(0);
    });
  });

  describe('getActionTypeFromActionId', () => {
    it('Standard action', async () => {
      expect(
        referentielsService.getActionTypeFromActionId('cae_5.1.4.4.1', [
          ActionType.REFERENTIEL,
          ActionType.AXE,
          ActionType.SOUS_AXE,
          ActionType.ACTION,
          ActionType.SOUS_ACTION,
          ActionType.TACHE,
        ])
      ).toEqual(ActionType.TACHE);
    });

    it('Axe', async () => {
      expect(
        referentielsService.getActionTypeFromActionId('cae_5', [
          ActionType.REFERENTIEL,
          ActionType.AXE,
          ActionType.SOUS_AXE,
          ActionType.ACTION,
          ActionType.SOUS_ACTION,
          ActionType.TACHE,
        ])
      ).toEqual(ActionType.AXE);
    });

    it('Referentiel', async () => {
      expect(
        referentielsService.getActionTypeFromActionId('cae', [
          ActionType.REFERENTIEL,
          ActionType.AXE,
          ActionType.SOUS_AXE,
          ActionType.ACTION,
          ActionType.SOUS_ACTION,
          ActionType.TACHE,
        ])
      ).toEqual(ActionType.REFERENTIEL);
    });

    it('Throw', async () => {
      expect(() =>
        referentielsService.getActionTypeFromActionId('cae_5.1.4.4.1.1', [
          ActionType.REFERENTIEL,
          ActionType.AXE,
          ActionType.SOUS_AXE,
          ActionType.ACTION,
          ActionType.SOUS_ACTION,
          ActionType.TACHE,
        ])
      ).toThrow(
        'Action level 6 non consistent with referentiel action types: referentiel,axe,sous-axe,action,sous-action,tache'
      );
    });
  });

  describe('parseActionsOrigine', () => {
    it('Standard test without ponderation', async () => {
      const expectedCreateActionOrigines: CreateActionOrigineType[] = [
        {
          actionId: 'te_3.5.4',
          origineActionId: 'eci_3.5.3.6',
          origineReferentielId: 'eci',
          ponderation: 1,
          referentielId: 'te',
        },
        {
          actionId: 'te_3.5.4',
          origineActionId: 'eci_3.5.4.2',
          origineReferentielId: 'eci',
          ponderation: 1,
          referentielId: 'te',
        },
      ];
      expect(
        referentielsService.parseActionsOrigine(
          ReferentielType.TE,
          'te_3.5.4',
          `Eci_3.5.3.6
Eci_3.5.4.2`,
          refentielDefinitions
        )
      ).toEqual(expectedCreateActionOrigines);
    });

    it('Standard test with ponderation', async () => {
      const expectedCreateActionOrigines: CreateActionOrigineType[] = [
        {
          actionId: 'te_3.5.4',
          origineActionId: 'cae_5.1.4.4.1',
          origineReferentielId: 'cae',
          ponderation: 1,
          referentielId: 'te',
        },
        {
          actionId: 'te_3.5.4',
          origineActionId: 'cae_5.1.4.4.2',
          origineReferentielId: 'cae',
          ponderation: 0.5,
          referentielId: 'te',
        },
        {
          actionId: 'te_3.5.4',
          origineActionId: 'eci_1.3.2.4',
          origineReferentielId: 'eci',
          ponderation: 1,
          referentielId: 'te',
        },
      ];

      expect(
        referentielsService.parseActionsOrigine(
          ReferentielType.TE,
          'te_3.5.4',
          `Cae_5.1.4.4.1 (1)
Cae_5.1.4.4.2 (0,5)
Eci_1.3.2.4 (1)`,
          refentielDefinitions
        )
      ).toEqual(expectedCreateActionOrigines);
    });

    it('Invalid action id', async () => {
      expect(() =>
        referentielsService.parseActionsOrigine(
          ReferentielType.TE,
          'te_3.5.4',
          `Cae 5.1.4.4.1`,
          refentielDefinitions
        )
      ).toThrow('Invalid origine value cae 5.1.4.4.1 for action te_3.5.4');

      expect(() =>
        referentielsService.parseActionsOrigine(
          ReferentielType.TE,
          'te_3.5.4',
          `test_.1.4.4.1`,
          refentielDefinitions
        )
      ).toThrow('Invalid origine value test_.1.4.4.1 for action te_3.5.4');

      expect(() =>
        referentielsService.parseActionsOrigine(
          ReferentielType.TE,
          'te_3.5.4',
          `test_1.1.4.4.1 0.5`,
          refentielDefinitions
        )
      ).toThrow('Invalid origine value test_1.1.4.4.1 0.5 for action te_3.5.4');
    });

    it('Invalid action id referentiel', async () => {
      expect(() =>
        referentielsService.parseActionsOrigine(
          ReferentielType.TE,
          'te_3.5.4',
          `Ca_5.1.4.4.1`,
          refentielDefinitions
        )
      ).toThrow(
        'Invalid origine value referentiel ca_5.1.4.4.1 (referentiel ca) for action te_3.5.'
      );
    });

    it('Invalid ponderation', async () => {
      expect(() =>
        referentielsService.parseActionsOrigine(
          ReferentielType.TE,
          'te_3.5.4',
          `Cae_5.1.4.4.1 (zero)`,
          refentielDefinitions
        )
      ).toThrow(
        'Invalid ponderation value zero) for origine cae_5.1.4.4.1 (zero) of action te_3.5.4'
      );
    });
  });
});
