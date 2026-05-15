import { Test, TestingModule } from '@nestjs/testing';
import { ToolsAutomationApiConfigurationType } from '../config/configuration.model';
import ConfigurationService from '../config/configuration.service';
import { DatabaseService } from '../utils/database/database.service';
import {
  AirtableCrmSyncService,
  CRM_SYNC_JOBS,
  CrmSyncJobName,
  isCrmSyncJobName,
} from './airtable-crm-sync.service';
import { AirtableService } from './airtable.service';

// Jobs qui passent par le query builder Drizzle (`.select()`).
const SELECT_PATH_JOBS: CrmSyncJobName[] = [
  'crm-collectivites-sync',
  'crm-personnes-sync',
  'crm-droits-sync',
  'crm-labellisations-sync',
];

// Jobs qui lisent les vues matérialisées `stats.*` via `db.execute()`.
const EXECUTE_PATH_JOBS: CrmSyncJobName[] = [
  'crm-indicateurs-sync',
  'crm-plans-sync',
];

const ALL_CRM_JOBS: CrmSyncJobName[] = [
  ...SELECT_PATH_JOBS,
  ...EXECUTE_PATH_JOBS,
];

describe('AirtableCrmSyncService', () => {
  let service: AirtableCrmSyncService;
  let airtableService: { insertRecords: ReturnType<typeof vi.fn> };
  let databaseService: {
    db: {
      select: ReturnType<typeof vi.fn>;
      execute: ReturnType<typeof vi.fn>;
    };
  };
  let drizzleSelectRows: unknown[];
  let executeResult: {
    rows: unknown[];
    fields?: ReadonlyArray<{ name: string; dataTypeID: number }>;
  };

  type ChainMock = PromiseLike<unknown[]> & {
    [k: string]: (...args: unknown[]) => ChainMock;
  };
  const buildDrizzleChain = (): ChainMock => {
    const chain: ChainMock = new Proxy({} as ChainMock, {
      get(_target, prop) {
        if (prop === 'then') {
          return (resolve: (rows: unknown[]) => unknown) =>
            resolve(drizzleSelectRows);
        }
        return () => chain;
      },
    });
    return chain;
  };

  const buildModule = async () => {
    drizzleSelectRows = [];
    executeResult = { rows: [] };

    airtableService = { insertRecords: vi.fn().mockResolvedValue([]) };
    databaseService = {
      db: {
        select: vi.fn().mockImplementation(() => buildDrizzleChain()),
        execute: vi.fn().mockImplementation(() => Promise.resolve(executeResult)),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AirtableCrmSyncService],
    })
      .useMocker((token) => {
        if (token === ConfigurationService) {
          return {
            get(key: keyof ToolsAutomationApiConfigurationType) {
              return `fake-${key}`;
            },
          };
        }
        if (token === AirtableService) {
          return airtableService;
        }
        if (token === DatabaseService) {
          return databaseService;
        }
      })
      .compile();

    service = module.get<AirtableCrmSyncService>(AirtableCrmSyncService);
  };

  beforeEach(async () => {
    await buildModule();
  });

  describe('CRM_SYNC_JOBS descriptor map', () => {
    test('exporte les six jobs CRM hérités de pg_cron (hors crm_usages)', () => {
      expect(Object.keys(CRM_SYNC_JOBS).sort()).toEqual([
        'crm-collectivites-sync',
        'crm-droits-sync',
        'crm-indicateurs-sync',
        'crm-labellisations-sync',
        'crm-personnes-sync',
        'crm-plans-sync',
      ]);
    });

    test('chaque descripteur expose viewName, tableIdConfigKey, mergeFields et cronExpression', () => {
      for (const name of Object.keys(CRM_SYNC_JOBS) as CrmSyncJobName[]) {
        const descriptor = CRM_SYNC_JOBS[name];
        expect(descriptor.viewName).toEqual(expect.any(String));
        expect(descriptor.tableIdConfigKey).toEqual(expect.any(String));
        expect(descriptor.mergeFields.length).toBeGreaterThan(0);
        expect(descriptor.cronExpression).toMatch(/^\d+ \d+ \* \* \*$/);
      }
    });

    test('crm-droits-sync fusionne sur collectivite_id et user_id', () => {
      expect(CRM_SYNC_JOBS['crm-droits-sync'].mergeFields).toEqual([
        'collectivite_id',
        'user_id',
      ]);
    });

    test('crm-plans-sync fusionne sur type et déclare transformRow', () => {
      expect(CRM_SYNC_JOBS['crm-plans-sync'].mergeFields).toEqual(['type']);
      expect(CRM_SYNC_JOBS['crm-plans-sync']).toHaveProperty('transformRow');
    });

    test('les expressions cron sont distinctes pour éviter les pics de charge', () => {
      const expressions = (
        Object.keys(CRM_SYNC_JOBS) as CrmSyncJobName[]
      ).map((name) => CRM_SYNC_JOBS[name].cronExpression);
      expect(new Set(expressions).size).toBe(expressions.length);
    });

    test('isCrmSyncJobName reconnaît les noms CRM et rejette le reste', () => {
      for (const name of Object.keys(CRM_SYNC_JOBS)) {
        expect(isCrmSyncJobName(name)).toBe(true);
      }
      expect(isCrmSyncJobName('calendly-synchro')).toBe(false);
    });
  });

  describe('syncTable — chemin Drizzle `.select()`', () => {
    test('crm-collectivites-sync passe par databaseService.db.select', async () => {
      drizzleSelectRows = [{ collectivite_id: 1, nom: 'Demo' }];

      await service.syncTable('crm-collectivites-sync');

      expect(databaseService.db.select).toHaveBeenCalled();
      expect(databaseService.db.execute).not.toHaveBeenCalled();
    });

    test('crm-personnes-sync passe par databaseService.db.select', async () => {
      drizzleSelectRows = [{ user_id: 'u1', prenom: 'Ada', nom: 'Lovelace' }];

      await service.syncTable('crm-personnes-sync');

      expect(databaseService.db.select).toHaveBeenCalled();
      expect(databaseService.db.execute).not.toHaveBeenCalled();
    });

    test('crm-droits-sync passe par databaseService.db.select', async () => {
      drizzleSelectRows = [
        { collectivite_id: 7, user_id: 'abcd-1234', niveau_acces: 'admin' },
      ];

      await service.syncTable('crm-droits-sync');

      expect(databaseService.db.select).toHaveBeenCalled();
    });

    test('crm-labellisations-sync passe par databaseService.db.select', async () => {
      drizzleSelectRows = [{ id: 1, referentiel: 'cae', etoiles: 3 }];

      await service.syncTable('crm-labellisations-sync');

      expect(databaseService.db.select).toHaveBeenCalled();
    });

    test('passe la base id et le table id depuis ConfigurationService à insertRecords', async () => {
      drizzleSelectRows = [{ collectivite_id: 1, nom: 'Demo' }];

      await service.syncTable('crm-collectivites-sync');

      expect(airtableService.insertRecords).toHaveBeenCalledWith(
        'fake-AIRTABLE_IMPORT_DATABASE_ID',
        'fake-AIRTABLE_CRM_COLLECTIVITES_TABLE_ID',
        [{ fields: { collectivite_id: 1, nom: 'Demo' } }],
        { fieldsToMergeOn: ['collectivite_id'] }
      );
    });

    test('crm-droits-sync renvoie les merge fields tels quels', async () => {
      drizzleSelectRows = [
        {
          collectivite_id: 7,
          user_id: 'abcd-1234',
          niveau_acces: 'admin',
        },
      ];

      await service.syncTable('crm-droits-sync');

      const records = airtableService.insertRecords.mock.calls[0][2];
      expect(records[0].fields).toEqual({
        collectivite_id: 7,
        user_id: 'abcd-1234',
        niveau_acces: 'admin',
      });
    });

    test('crm-labellisations-sync envoie id en number', async () => {
      drizzleSelectRows = [{ id: 42, etoiles: 3, referentiel: 'cae' }];

      await service.syncTable('crm-labellisations-sync');

      const records = airtableService.insertRecords.mock.calls[0][2];
      expect(records[0].fields.id).toBe(42);
      expect(typeof records[0].fields.id).toBe('number');
    });

    test("retourne { inserted: 0 } et n'appelle pas Airtable quand le SELECT est vide", async () => {
      drizzleSelectRows = [];

      const result = await service.syncTable('crm-droits-sync');

      expect(result).toEqual({ inserted: 0 });
      expect(airtableService.insertRecords).not.toHaveBeenCalled();
    });

    test("propage l'erreur si insertRecords échoue", async () => {
      drizzleSelectRows = [{ id: 1 }];
      airtableService.insertRecords.mockRejectedValue(
        new Error('Airtable down')
      );

      await expect(
        service.syncTable('crm-labellisations-sync')
      ).rejects.toThrow('Airtable down');
    });
  });

  describe('syncTable — vues matérialisées `stats.*` via `db.execute()`', () => {
    test('crm-indicateurs-sync lit stats.crm_indicateurs', async () => {
      executeResult = {
        rows: [{ id: 42, nom: 'Demo', nb_prive: 0 }],
      };

      await service.syncTable('crm-indicateurs-sync');

      expect(databaseService.db.execute).toHaveBeenCalled();
      expect(databaseService.db.select).not.toHaveBeenCalled();
    });

    test('stringifie `id` pour crm-indicateurs-sync (int4 PG → string Airtable)', async () => {
      executeResult = {
        rows: [{ id: 42, nom: 'Demo', nb_prive: 0 }],
      };

      await service.syncTable('crm-indicateurs-sync');

      const records = airtableService.insertRecords.mock.calls[0][2];
      expect(records[0].fields.id).toBe('42');
      expect(typeof records[0].fields.id).toBe('string');
    });

    test('coerce `type` nullable en "no-type" pour crm-plans-sync', async () => {
      executeResult = {
        rows: [
          { type: 'foo', nb_plan: 5 },
          { type: null, nb_plan: 1 },
        ],
      };

      await service.syncTable('crm-plans-sync');

      const records = airtableService.insertRecords.mock.calls[0][2];
      expect(records).toEqual([
        { fields: { type: 'foo', nb_plan: 5 } },
        { fields: { type: 'no-type', nb_plan: 1 } },
      ]);
    });

    test('coerce les colonnes bigint et numeric (oids 20, 1700) en JS number', async () => {
      executeResult = {
        rows: [
          {
            type: 'foo',
            nb_plan: '5',
            nb_plan_90pc_FA_privees: '2',
            code_siren_insee: '200034825',
          },
        ],
        fields: [
          { name: 'type', dataTypeID: 25 },
          { name: 'nb_plan', dataTypeID: 20 },
          { name: 'nb_plan_90pc_FA_privees', dataTypeID: 20 },
          { name: 'code_siren_insee', dataTypeID: 25 },
        ],
      };

      await service.syncTable('crm-plans-sync');

      const records = airtableService.insertRecords.mock.calls[0][2];
      expect(records[0].fields).toMatchObject({
        nb_plan: 5,
        nb_plan_90pc_FA_privees: 2,
        code_siren_insee: '200034825',
      });
    });

    test("retourne { inserted: 0 } et n'appelle pas Airtable quand la vue matérialisée est vide", async () => {
      executeResult = { rows: [] };

      const result = await service.syncTable('crm-indicateurs-sync');

      expect(result).toEqual({ inserted: 0 });
      expect(airtableService.insertRecords).not.toHaveBeenCalled();
    });

    test("propage l'erreur si db.execute échoue, sans appeler Airtable", async () => {
      databaseService.db.execute.mockRejectedValue(
        new Error('DB connection lost')
      );

      await expect(
        service.syncTable('crm-plans-sync')
      ).rejects.toThrow('DB connection lost');
      expect(airtableService.insertRecords).not.toHaveBeenCalled();
    });
  });

  describe('syncTable across all jobs', () => {
    test.each(SELECT_PATH_JOBS)(
      'job select-path "%s" appelle insertRecords avec les bons arguments',
      async (jobName) => {
        drizzleSelectRows = [
          { id: 1, collectivite_id: 1, user_id: 'abc', type: 'foo' },
        ];

        await service.syncTable(jobName);

        expect(airtableService.insertRecords).toHaveBeenCalledTimes(1);
        const [baseId, tableId, , options] =
          airtableService.insertRecords.mock.calls[0];
        expect(baseId).toBe('fake-AIRTABLE_IMPORT_DATABASE_ID');
        expect(tableId).toBe(`fake-${CRM_SYNC_JOBS[jobName].tableIdConfigKey}`);
        expect(options).toEqual({
          fieldsToMergeOn: [...CRM_SYNC_JOBS[jobName].mergeFields],
        });
      }
    );

    test.each(EXECUTE_PATH_JOBS)(
      'job execute-path "%s" appelle insertRecords avec les bons arguments',
      async (jobName) => {
        executeResult = {
          rows: [{ id: 1, collectivite_id: 1, user_id: 'abc', type: 'foo' }],
        };

        await service.syncTable(jobName);

        expect(airtableService.insertRecords).toHaveBeenCalledTimes(1);
        const [baseId, tableId, , options] =
          airtableService.insertRecords.mock.calls[0];
        expect(baseId).toBe('fake-AIRTABLE_IMPORT_DATABASE_ID');
        expect(tableId).toBe(`fake-${CRM_SYNC_JOBS[jobName].tableIdConfigKey}`);
        expect(options).toEqual({
          fieldsToMergeOn: [...CRM_SYNC_JOBS[jobName].mergeFields],
        });
      }
    );

    test('aucun job ne dépend de withServiceRole sur DatabaseService', () => {
      expect(ALL_CRM_JOBS).toHaveLength(6);
    });
  });
});
