import { ImportIndicateurRelationsService } from './import-indicateur-relations.service';
import { UpsertIndicateurDefinitionsService } from './upsert-indicateur-definitions.service';
import { Test } from '@nestjs/testing';
import PersonnalisationsExpressionService from '@tet/backend/collectivites/personnalisations/services/personnalisations-expression.service';
import { IndicateurFormulaReconciliationRepository } from '@tet/backend/indicateurs/definitions/indicateur-formula-reconciliation.repository';
import { IndicateurFormulaReconciliationService } from '@tet/backend/indicateurs/definitions/indicateur-formula-reconciliation.service';
import ImportIndicateurDefinitionService from '@tet/backend/indicateurs/import-indicateurs/import-indicateur-definition.service';
import IndicateurExpressionService from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import { getServiceRoleUser } from '@tet/backend/test';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import SheetService from '@tet/backend/utils/google-sheets/sheet.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import VersionService from '@tet/backend/utils/version/version.service';
import { cloneDeep } from 'es-toolkit';
import { IndicateurDefinitionLockRepository } from '../definitions/indicateur-definition-lock.repository';
import { IndicateurPeriodiciteAvailabilityService } from '../definitions/indicateur-periodicite-availability.service';
import { ListPlatformDefinitionsRepository } from '../definitions/list-platform-definitions/list-platform-definitions.repository';
import {
  sampleImportIndicateurDefinition,
  sampleImportIndicateurDefinition2,
} from './samples/import-indicateur-definition.sample';
import { ImportIndicateurDefinitionRepository } from './import-indicateur-definition.repository';
import { importObjectifSchema } from './import-indicateur-objectif.dto';

describe('importObjectifSchema', () => {
  test("accepte une date ISO ordinaire pour l'année-horizon", () => {
    expect(
      importObjectifSchema.parse({
        identifiantReferentiel: 'cae_1.a',
        dateValeur: '2030-12-31',
        formule: '42',
      })
    ).toEqual({
      identifiantReferentiel: 'cae_1.a',
      dateValeur: '2030-12-31',
      formule: '42',
    });
  });

  test('refuse une date invalide', () => {
    expect(
      importObjectifSchema.safeParse({
        identifiantReferentiel: 'cae_1.a',
        dateValeur: '2030-02-30',
        formule: '42',
      }).success
    ).toBe(false);
  });
});

describe('Indicateurs → import-indicateur-definition.service', () => {
  let importIndicateurDefinitionService: ImportIndicateurDefinitionService;
  let versionService: VersionService;
  const configurationService = { get: vi.fn(() => 'spreadsheet-id') };
  const sheetService = {
    getDefaultRangeFromHeader: vi.fn(() => 'Objectifs!A:C'),
    getDataFromSheet: vi.fn(),
  };
  const listPlatformDefinitionsRepository = {
    listPlatformDefinitions: vi.fn(),
  };
  const periodiciteAvailabilityService = {
    checkAssignmentAvailable: vi.fn(),
  };
  const transaction = {} as Transaction;
  const transactionManager = {
    executeSingle: vi.fn(
      async (operation: (tx: Transaction) => Promise<unknown>) => {
        try {
          return await operation(transaction);
        } catch (error) {
          return failure(error);
        }
      }
    ),
  };
  const importRepository = {
    findFirstIndicateurIdWithValeur: vi.fn().mockResolvedValue(null),
    listThematiques: vi.fn().mockResolvedValue([]),
    listCategories: vi.fn().mockResolvedValue([]),
    listDefinitionSnapshots: vi.fn().mockResolvedValue([]),
    deleteGroupRelationsByChildIds: vi.fn().mockResolvedValue(undefined),
    upsertDefinitions: vi.fn().mockResolvedValue([]),
    createCategories: vi.fn().mockResolvedValue([]),
    createThematiques: vi.fn().mockResolvedValue([]),
    replaceCategorieRelations: vi.fn().mockResolvedValue(undefined),
    replaceThematiqueRelations: vi.fn().mockResolvedValue(undefined),
    replaceGroupRelations: vi.fn().mockResolvedValue(undefined),
    upsertObjectifs: vi.fn().mockResolvedValue(undefined),
  };
  const definitionLockRepository = {
    lockForDefinitionMutation: vi.fn(),
  };
  const formulaReconciliationRepository = {
    enqueueForDefinition: vi.fn(),
  };
  const formulaReconciliationService = {
    drain: vi.fn(),
  };
  const permissionService = {
    hasServiceRole: vi.fn(),
  };
  const serviceRoleUser = getServiceRoleUser();

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ImportIndicateurDefinitionService,
        ImportIndicateurRelationsService,
        UpsertIndicateurDefinitionsService,
        IndicateurExpressionService,
        PersonnalisationsExpressionService,
        VersionService,
      ],
    })
      .useMocker((token) => {
        if (token === ConfigurationService) {
          return configurationService;
        }
        if (token === SheetService) {
          return sheetService;
        }
        if (token === ListPlatformDefinitionsRepository) {
          return listPlatformDefinitionsRepository;
        }
        if (token === IndicateurPeriodiciteAvailabilityService) {
          return periodiciteAvailabilityService;
        }
        if (token === ImportIndicateurDefinitionRepository) {
          return importRepository;
        }
        if (token === TransactionManager) {
          return transactionManager;
        }
        if (token === IndicateurDefinitionLockRepository) {
          return definitionLockRepository;
        }
        if (token === IndicateurFormulaReconciliationRepository) {
          return formulaReconciliationRepository;
        }
        if (token === IndicateurFormulaReconciliationService) {
          return formulaReconciliationService;
        }
        if (token === PermissionService) {
          return permissionService;
        }
      })
      .compile();

    importIndicateurDefinitionService = moduleRef.get(
      ImportIndicateurDefinitionService
    );
    versionService = moduleRef.get(VersionService);
    vi.clearAllMocks();
    transactionManager.executeSingle.mockImplementation(
      async (operation: (tx: Transaction) => Promise<unknown>) => {
        try {
          return await operation(transaction);
        } catch (error) {
          return failure(error);
        }
      }
    );
    importRepository.findFirstIndicateurIdWithValeur.mockResolvedValue(null);
    importRepository.listThematiques.mockResolvedValue([]);
    importRepository.listCategories.mockResolvedValue([]);
    importRepository.listDefinitionSnapshots.mockResolvedValue([]);
    importRepository.deleteGroupRelationsByChildIds.mockResolvedValue(
      undefined
    );
    importRepository.upsertDefinitions.mockResolvedValue([]);
    importRepository.createCategories.mockResolvedValue([]);
    importRepository.createThematiques.mockResolvedValue([]);
    importRepository.replaceCategorieRelations.mockResolvedValue(undefined);
    importRepository.replaceThematiqueRelations.mockResolvedValue(undefined);
    importRepository.replaceGroupRelations.mockResolvedValue(undefined);
    importRepository.upsertObjectifs.mockResolvedValue(undefined);
    periodiciteAvailabilityService.checkAssignmentAvailable.mockResolvedValue(
      success(undefined)
    );
    formulaReconciliationRepository.enqueueForDefinition.mockResolvedValue({
      generation: '00000000-0000-4000-8000-000000000001',
      workItemsCount: 0,
    });
    formulaReconciliationService.drain.mockResolvedValue({
      processedCount: 0,
      obsoleteCount: 0,
      failedCount: 0,
      remainingCount: 0,
      complete: true,
      identifiants: [],
    });
    permissionService.hasServiceRole.mockReturnValue(true);
  });

  test("importe un objectif annuel indépendamment de la périodicité d'observation", async () => {
    sheetService.getDataFromSheet.mockResolvedValueOnce({
      data: [
        {
          identifiantReferentiel: 'cae_1.a',
          dateValeur: '2030-12-31',
          formule: '42',
        },
      ],
    });
    const definitions = [
      {
        id: 12,
        identifiantReferentiel: 'cae_1.a',
        periodicite: 'mensuelle',
      },
    ] as unknown as Parameters<
      ImportIndicateurDefinitionService['importObjectifs']
    >[0];

    await expect(
      importIndicateurDefinitionService.importObjectifs(definitions)
    ).resolves.toEqual([
      {
        indicateurId: 12,
        dateValeur: '2030-12-31',
        formule: '42',
      },
    ]);
  });

  test('préserve une erreur de commit renvoyée par le gestionnaire de transaction', async () => {
    listPlatformDefinitionsRepository.listPlatformDefinitions.mockResolvedValue(
      []
    );
    transactionManager.executeSingle.mockResolvedValueOnce(
      failure(new Error('commit failed'))
    );

    await expect(
      importIndicateurDefinitionService.upsertIndicateurDefinitions([
        sampleImportIndicateurDefinition,
      ])
    ).rejects.toThrow('commit failed');
  });

  test('refuse un indicateur mensuel du diagnostic PCAET avant toute écriture', async () => {
    await expect(
      importIndicateurDefinitionService.upsertIndicateurDefinitions([
        { ...sampleImportIndicateurDefinition, periodicite: 'mensuelle' },
      ])
    ).rejects.toThrow('diagnostic PCAET');
    expect(importRepository.upsertDefinitions).not.toHaveBeenCalled();
  });

  test("refuse une nouvelle cadence de catalogue avant toute écriture lorsqu'elle n'est pas activée", async () => {
    const monthlyDefinition = cloneDeep(sampleImportIndicateurDefinition);
    monthlyDefinition.periodicite = 'mensuelle';
    monthlyDefinition.identifiantReferentiel = 'test_mensuel';
    listPlatformDefinitionsRepository.listPlatformDefinitions.mockResolvedValue(
      []
    );
    periodiciteAvailabilityService.checkAssignmentAvailable.mockResolvedValue(
      failure('PERIODICITE_UNAVAILABLE', new Error('catalog rollout disabled'))
    );

    await expect(
      importIndicateurDefinitionService.upsertIndicateurDefinitions([
        monthlyDefinition,
      ])
    ).rejects.toThrow('catalog rollout disabled');
    expect(
      periodiciteAvailabilityService.checkAssignmentAvailable
    ).toHaveBeenCalledWith(
      { periodicite: 'mensuelle', current: undefined },
      { user: null, isUserTrusted: true }
    );
  });

  test("refuse un import dont l'instantané de périodicité a changé avant le verrou exclusif", async () => {
    const monthlyDefinition = cloneDeep(sampleImportIndicateurDefinition);
    monthlyDefinition.periodicite = 'mensuelle';
    monthlyDefinition.identifiantReferentiel = 'test_mensuel';
    listPlatformDefinitionsRepository.listPlatformDefinitions.mockResolvedValue(
      [{ ...monthlyDefinition, id: 42 }]
    );

    importRepository.listDefinitionSnapshots.mockResolvedValue([
      {
        identifiantReferentiel: monthlyDefinition.identifiantReferentiel,
        periodicite: 'annuelle',
        valeurCalcule: monthlyDefinition.valeurCalcule,
      },
    ]);

    await expect(
      importIndicateurDefinitionService.upsertIndicateurDefinitions([
        monthlyDefinition,
      ])
    ).rejects.toThrow(/a changé pendant l'import/i);
    expect(
      periodiciteAvailabilityService.checkAssignmentAvailable
    ).toHaveBeenCalledWith(
      { periodicite: 'mensuelle', current: 'mensuelle' },
      { user: null, isUserTrusted: true }
    );
    expect(
      definitionLockRepository.lockForDefinitionMutation
    ).toHaveBeenCalledWith(transaction);
    expect(
      importRepository.deleteGroupRelationsByChildIds
    ).not.toHaveBeenCalled();
    expect(importRepository.upsertDefinitions).not.toHaveBeenCalled();
  });

  test("revérifie l'absence de valeur sous le verrou exclusif", async () => {
    const monthlyDefinition = cloneDeep(sampleImportIndicateurDefinition);
    monthlyDefinition.periodicite = 'mensuelle';
    monthlyDefinition.identifiantReferentiel = 'test_mensuel';
    const existingDefinition = {
      ...monthlyDefinition,
      id: 42,
      periodicite: 'annuelle' as const,
    };
    listPlatformDefinitionsRepository.listPlatformDefinitions.mockResolvedValue(
      [existingDefinition]
    );
    importRepository.listDefinitionSnapshots.mockResolvedValue([
      {
        identifiantReferentiel: existingDefinition.identifiantReferentiel,
        periodicite: existingDefinition.periodicite,
        valeurCalcule: existingDefinition.valeurCalcule,
      },
    ]);
    importRepository.findFirstIndicateurIdWithValeur
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingDefinition.id);

    await expect(
      importIndicateurDefinitionService.upsertIndicateurDefinitions([
        monthlyDefinition,
      ])
    ).rejects.toThrow(/des valeurs existent déjà/i);
    expect(
      importRepository.findFirstIndicateurIdWithValeur
    ).toHaveBeenNthCalledWith(2, [existingDefinition.id], transaction);
    expect(
      importRepository.deleteGroupRelationsByChildIds
    ).not.toHaveBeenCalled();
    expect(importRepository.upsertDefinitions).not.toHaveBeenCalled();
  });

  test('refuse un import dont la formule a changé avant le verrou exclusif', async () => {
    const importedDefinition = cloneDeep(sampleImportIndicateurDefinition);
    importedDefinition.valeurCalcule = '1';
    listPlatformDefinitionsRepository.listPlatformDefinitions.mockResolvedValue(
      [{ ...importedDefinition, id: 42, valeurCalcule: null }]
    );

    importRepository.listDefinitionSnapshots.mockResolvedValue([
      {
        identifiantReferentiel: importedDefinition.identifiantReferentiel,
        periodicite: importedDefinition.periodicite,
        valeurCalcule: '2',
      },
    ]);

    await expect(
      importIndicateurDefinitionService.upsertIndicateurDefinitions([
        importedDefinition,
      ])
    ).rejects.toThrow(/définition.*a changé pendant l'import/i);
    expect(
      importRepository.deleteGroupRelationsByChildIds
    ).not.toHaveBeenCalled();
    expect(importRepository.upsertDefinitions).not.toHaveBeenCalled();
  });

  test("refuse les objectifs associés à un identifiant inconnu avant d'ouvrir la transaction", async () => {
    const importedDefinition = cloneDeep(sampleImportIndicateurDefinition);

    await expect(
      importIndicateurDefinitionService.upsertIndicateurDefinitions(
        [importedDefinition],
        [
          {
            identifiantReferentiel: 'indicateur.inconnu',
            dateValeur: '2030-12-31',
            formule: '42',
          },
        ]
      )
    ).rejects.toThrow(/indicateurs inconnus.*indicateur\.inconnu/i);

    expect(transactionManager.executeSingle).not.toHaveBeenCalled();
    expect(importRepository.upsertDefinitions).not.toHaveBeenCalled();
  });

  test('retourne un catalogue commité quand le drain échoue après la transaction', async () => {
    const importedDefinition = cloneDeep(sampleImportIndicateurDefinition);
    const committedDefinition = {
      ...importedDefinition,
      id: 42,
      version: '2.0.0',
    };
    listPlatformDefinitionsRepository.listPlatformDefinitions.mockResolvedValueOnce(
      [committedDefinition]
    );
    const checkLastVersion = vi
      .spyOn(importIndicateurDefinitionService, 'checkLastVersion')
      .mockResolvedValueOnce('2.0.0');
    sheetService.getDataFromSheet
      .mockResolvedValueOnce({ data: [importedDefinition] })
      .mockResolvedValueOnce({ data: [] });
    const upsertDefinitions = vi
      .spyOn(importIndicateurDefinitionService, 'upsertIndicateurDefinitions')
      .mockResolvedValueOnce({
        definitions: [committedDefinition] as never,
        updatedFormulaDefinitions: [committedDefinition] as never,
        importedIndicateurIds: [committedDefinition.id],
        reconciliationWorkItemsCount: 3,
      });
    formulaReconciliationService.drain.mockRejectedValueOnce(
      new Error('worker unavailable')
    );

    await expect(
      importIndicateurDefinitionService.importIndicateurDefinitions(
        serviceRoleUser
      )
    ).resolves.toEqual({
      status: 'committed',
      definitions: [committedDefinition],
      reconciliation: {
        status: 'failed',
        identifiantsRecalcules: [],
        reconciliationsMisesEnFile: 3,
        reconciliationsRestantes: null,
        reconciliationsEchouees: null,
        message:
          'Le catalogue est importé, mais la réconciliation des formules reste à reprendre.',
      },
    });
    expect(permissionService.hasServiceRole).toHaveBeenCalledWith(
      serviceRoleUser
    );
    expect(formulaReconciliationService.drain).toHaveBeenCalledWith({
      indicateurIds: [committedDefinition.id],
      includeDeferred: true,
    });

    checkLastVersion.mockRestore();
    upsertDefinitions.mockRestore();
  });

  test('explicite les réconciliations échouées sans annuler le catalogue', async () => {
    const importedDefinition = cloneDeep(sampleImportIndicateurDefinition);
    const committedDefinition = {
      ...importedDefinition,
      id: 42,
      version: '2.0.0',
    };
    listPlatformDefinitionsRepository.listPlatformDefinitions.mockResolvedValueOnce(
      [committedDefinition]
    );
    const checkLastVersion = vi
      .spyOn(importIndicateurDefinitionService, 'checkLastVersion')
      .mockResolvedValueOnce('2.0.0');
    sheetService.getDataFromSheet
      .mockResolvedValueOnce({ data: [importedDefinition] })
      .mockResolvedValueOnce({ data: [] });
    const upsertDefinitions = vi
      .spyOn(importIndicateurDefinitionService, 'upsertIndicateurDefinitions')
      .mockResolvedValueOnce({
        definitions: [committedDefinition] as never,
        updatedFormulaDefinitions: [committedDefinition] as never,
        importedIndicateurIds: [committedDefinition.id],
        reconciliationWorkItemsCount: 3,
      });
    formulaReconciliationService.drain.mockResolvedValueOnce({
      processedCount: 1,
      obsoleteCount: 0,
      failedCount: 2,
      remainingCount: 2,
      complete: false,
      identifiants: ['cae_1.a'],
    });

    await expect(
      importIndicateurDefinitionService.importIndicateurDefinitions(
        serviceRoleUser
      )
    ).resolves.toMatchObject({
      status: 'committed',
      reconciliation: {
        status: 'failed',
        identifiantsRecalcules: ['cae_1.a'],
        reconciliationsMisesEnFile: 3,
        reconciliationsRestantes: 2,
        reconciliationsEchouees: 2,
      },
    });

    checkLastVersion.mockRestore();
    upsertDefinitions.mockRestore();
  });

  test('refuse un import de production à version identique sans le confondre avec un drain', async () => {
    const definition = {
      ...cloneDeep(sampleImportIndicateurDefinition),
      id: 42,
      version: '2.0.0',
      valeurCalcule: 'val(cae_1.b)',
    };
    vi.spyOn(versionService, 'getVersion').mockReturnValue({
      environment: 'prod',
    } as never);
    listPlatformDefinitionsRepository.listPlatformDefinitions.mockResolvedValueOnce(
      [definition]
    );
    sheetService.getDataFromSheet.mockResolvedValueOnce({
      data: [{ version: '2.0.0' }],
    });
    const upsertDefinitions = vi.spyOn(
      importIndicateurDefinitionService,
      'upsertIndicateurDefinitions'
    );
    await expect(
      importIndicateurDefinitionService.importIndicateurDefinitions(
        serviceRoleUser
      )
    ).rejects.toThrow(/is not greater than current version/i);
    expect(upsertDefinitions).not.toHaveBeenCalled();
    expect(formulaReconciliationService.drain).not.toHaveBeenCalled();
    expect(sheetService.getDataFromSheet).toHaveBeenCalledOnce();
  });

  test("annule le changement de formule si l'intention durable ne peut pas être créée", async () => {
    const importedDefinition = {
      ...cloneDeep(sampleImportIndicateurDefinition),
      categories: [],
      thematiques: [],
      parents: null,
      valeurCalcule: '1',
    };
    const previousDefinition = {
      ...importedDefinition,
      id: 42,
      valeurCalcule: null,
    };
    const updatedDefinition = {
      ...importedDefinition,
      id: 42,
    };
    listPlatformDefinitionsRepository.listPlatformDefinitions.mockImplementation(
      (_input, currentTransaction) =>
        Promise.resolve(
          currentTransaction ? [updatedDefinition] : [previousDefinition]
        )
    );
    importRepository.listDefinitionSnapshots.mockResolvedValue([
      previousDefinition,
    ]);
    importRepository.upsertDefinitions.mockResolvedValue([updatedDefinition]);
    formulaReconciliationRepository.enqueueForDefinition
      .mockRejectedValueOnce(new Error('enqueue failed'))
      .mockResolvedValueOnce({
        generation: '00000000-0000-4000-8000-000000000002',
        workItemsCount: 3,
      });

    await expect(
      importIndicateurDefinitionService.upsertIndicateurDefinitions([
        importedDefinition,
      ])
    ).rejects.toThrow('enqueue failed');

    await expect(
      importIndicateurDefinitionService.upsertIndicateurDefinitions([
        importedDefinition,
      ])
    ).resolves.toMatchObject({
      updatedFormulaDefinitions: [updatedDefinition],
      importedIndicateurIds: [updatedDefinition.id],
      reconciliationWorkItemsCount: 3,
    });
    expect(transactionManager.executeSingle).toHaveBeenCalledTimes(2);
    expect(
      formulaReconciliationRepository.enqueueForDefinition
    ).toHaveBeenCalledTimes(2);
    expect(
      formulaReconciliationRepository.enqueueForDefinition
    ).toHaveBeenNthCalledWith(
      1,
      {
        indicateurId: updatedDefinition.id,
        expectedFormula: '1',
        sourceIdentifiants: [],
      },
      transaction
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

    test('Rejects a formula mixing annual and monthly definitions', async () => {
      const annualDefinition = cloneDeep(sampleImportIndicateurDefinition);
      const monthlyDefinition = cloneDeep(sampleImportIndicateurDefinition2);
      monthlyDefinition.periodicite = 'mensuelle';
      monthlyDefinition.identifiantReferentiel = 'test_mensuel';
      annualDefinition.valeurCalcule = `val(${monthlyDefinition.identifiantReferentiel}) / 10`;

      await expect(
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          annualDefinition,
          monthlyDefinition,
        ])
      ).rejects.toThrow(/different periodicite/i);
    });

    test('Rejects a group mixing annual and monthly definitions', async () => {
      const annualParent = cloneDeep(sampleImportIndicateurDefinition);
      const monthlyChild = cloneDeep(sampleImportIndicateurDefinition2);
      monthlyChild.periodicite = 'mensuelle';
      monthlyChild.parents = [annualParent.identifiantReferentiel];

      await expect(
        importIndicateurDefinitionService.checkIndicateurDefinitions([
          annualParent,
          monthlyChild,
        ])
      ).rejects.toThrow(/parent.*different periodicite/i);
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
      ).rejects.toThrow(/référentiel "xx" inconnu/i);
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
  });
});
