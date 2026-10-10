import { ReconcileIndicateurValeursService } from '../valeurs/reconcile-indicateur-valeurs/reconcile-indicateur-valeurs.service';
import { UnprocessableEntityException } from '@nestjs/common';
import { ImportIndicateurRelationsService } from './import-indicateur-relations.service';
import { UpsertIndicateurDefinitionsService } from './upsert-indicateur-definitions.service';
import { Test } from '@nestjs/testing';
import ListPersonnalisationQuestionsService from '@tet/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.service';
import PersonnalisationsExpressionService from '@tet/backend/collectivites/personnalisations/services/personnalisations-expression.service';
import ImportIndicateurDefinitionService from '@tet/backend/indicateurs/import-indicateurs/import-indicateur-definition.service';
import IndicateurExpressionService from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import SheetService from '@tet/backend/utils/google-sheets/sheet.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import VersionService from '@tet/backend/utils/version/version.service';
import { cloneDeep } from 'es-toolkit';
import { IndicateurDefinitionLockRepository } from '../definitions/indicateur-definition-lock.repository';
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
  const valeursService = { recomputeAll: vi.fn() };

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
        if (token === ListPersonnalisationQuestionsService) {
          return {
            listQuestionsWithChoices: async () => [
              { id: 'dechets_1', type: 'binaire', choix: [] },
            ],
          };
        }
        if (token === ConfigurationService) {
          return configurationService;
        }
        if (token === SheetService) {
          return sheetService;
        }
        if (token === ListPlatformDefinitionsRepository) {
          return listPlatformDefinitionsRepository;
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
        if (token === ReconcileIndicateurValeursService) {
          return valeursService;
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
    valeursService.recomputeAll.mockResolvedValue(success([]));
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

  test('accepte une nouvelle cadence mensuelle sans activation préalable', async () => {
    const monthlyDefinition = cloneDeep(sampleImportIndicateurDefinition);
    monthlyDefinition.periodicite = 'mensuelle';
    monthlyDefinition.identifiantReferentiel = 'test_mensuel';
    listPlatformDefinitionsRepository.listPlatformDefinitions.mockResolvedValue(
      []
    );

    await expect(
      importIndicateurDefinitionService.upsertIndicateurDefinitions([
        monthlyDefinition,
      ])
    ).resolves.toBeDefined();
    expect(importRepository.upsertDefinitions).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ periodicite: 'mensuelle' }),
      ]),
      transaction
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
      definitionLockRepository.lockForDefinitionMutation
    ).toHaveBeenCalledWith(transaction);
    expect(
      importRepository.deleteGroupRelationsByChildIds
    ).not.toHaveBeenCalled();
    expect(importRepository.upsertDefinitions).not.toHaveBeenCalled();
  });

  test('refuse de changer la périodicité même sans valeur enregistrée', async () => {
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

    await expect(
      importIndicateurDefinitionService.upsertIndicateurDefinitions([
        monthlyDefinition,
      ])
    ).rejects.toThrow(/fixée à sa création/i);
    expect(importRepository.upsertDefinitions).not.toHaveBeenCalled();
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

  test('retourne le catalogue et les identifiants recalculés après la transaction', async () => {
    const definition = {
      ...cloneDeep(sampleImportIndicateurDefinition),
      id: 42,
    };
    listPlatformDefinitionsRepository.listPlatformDefinitions.mockResolvedValueOnce(
      [definition]
    );
    const checkLastVersion = vi
      .spyOn(importIndicateurDefinitionService, 'checkLastVersion')
      .mockResolvedValueOnce('2.0.0');
    sheetService.getDataFromSheet
      .mockResolvedValueOnce({ data: [definition] })
      .mockResolvedValueOnce({ data: [] });
    const upsert = vi
      .spyOn(importIndicateurDefinitionService, 'upsertIndicateurDefinitions')
      .mockResolvedValueOnce({
        definitions: [definition] as never,
        updatedFormulaDefinitions: [definition] as never,
        identifiantsRecalcules: ['cae_1.a'],
      });

    await expect(
      importIndicateurDefinitionService.importIndicateurDefinitions()
    ).resolves.toEqual({
      definitions: [definition],
      identifiantsRecalcules: ['cae_1.a'],
    });
    checkLastVersion.mockRestore();
    upsert.mockRestore();
  });

  test('refuse un import de production à version identique avant les écritures', async () => {
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
      importIndicateurDefinitionService.importIndicateurDefinitions()
    ).rejects.toThrow(/is not greater than current version/i);
    expect(upsertDefinitions).not.toHaveBeenCalled();
    expect(valeursService.recomputeAll).not.toHaveBeenCalled();
    expect(sheetService.getDataFromSheet).toHaveBeenCalledOnce();
  });

  test("échoue si le recalcul échoue et permet de reprendre l'import", async () => {
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
    valeursService.recomputeAll
      .mockResolvedValueOnce(
        failure('DATABASE_ERROR', new Error('calculation failed'))
      )
      .mockResolvedValueOnce(
        success([
          { collectiviteId: 1, valeursCount: 2, identifiants: ['cae_1.a'] },
          { collectiviteId: 2, valeursCount: 1, identifiants: ['cae_1.a'] },
        ])
      );

    await expect(
      importIndicateurDefinitionService.upsertIndicateurDefinitions([
        importedDefinition,
      ])
    ).rejects.toThrow('calculation failed');
    await expect(
      importIndicateurDefinitionService.upsertIndicateurDefinitions([
        importedDefinition,
      ])
    ).resolves.toMatchObject({
      updatedFormulaDefinitions: [updatedDefinition],
      identifiantsRecalcules: ['cae_1.a'],
    });
    expect(transactionManager.executeSingle).toHaveBeenCalledTimes(2);
    expect(valeursService.recomputeAll).toHaveBeenCalledTimes(2);
    expect(valeursService.recomputeAll).toHaveBeenNthCalledWith(
      1,
      { definitions: [updatedDefinition] },
      { isUserTrusted: true, tx: transaction }
    );
  });

  test('refuse une référence de personnalisation inconnue avant toute écriture', async () => {
    const definition = cloneDeep(sampleImportIndicateurDefinition);
    definition.exprSeuil =
      'si reponse(question_inexistante, oui) alors 20 sinon 10';

    await expect(
      importIndicateurDefinitionService.upsertIndicateurDefinitions([
        definition,
      ])
    ).rejects.toThrow(/question "question_inexistante"/i);
    expect(transactionManager.executeSingle).not.toHaveBeenCalled();
    expect(importRepository.upsertDefinitions).not.toHaveBeenCalled();
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

    test.each([
      {
        type: 'références',
        exprCible: 'si identite(typ, commune) alors 1',
        exprSeuil: 'si demarche(inconnu) alors 1',
      },
      {
        type: 'syntaxe et référentiel',
        exprCible: 'si dentite(sinoe, dense) alors 280 sinon 380',
        exprSeuil: 'si referentiel(xx) alors 20 sinon 10',
      },
    ])(
      'Les erreurs de plusieurs indicateurs sont réunies dans un seul message ($type)',
      async ({ exprCible, exprSeuil }) => {
        const indicateurDefinition = cloneDeep(
          sampleImportIndicateurDefinition
        );
        const indicateurDefinition2 = cloneDeep(
          sampleImportIndicateurDefinition2
        );
        indicateurDefinition.exprCible = exprCible;
        indicateurDefinition2.exprSeuil = exprSeuil;

        const promise =
          importIndicateurDefinitionService.checkIndicateurDefinitions([
            indicateurDefinition,
            indicateurDefinition2,
          ]);
        await expect(promise).rejects.toThrow(
          /indicateur cae_1\.a[\s\S]*\n[\s\S]*indicateur cae_1\.b/
        );
      }
    );

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
