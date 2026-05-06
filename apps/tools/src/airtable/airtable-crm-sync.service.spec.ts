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

// Quels descripteurs passent par le chemin "vue + withServiceRole" vs par
// les fetchers Drizzle dédiés (cf. switch dans syncTable).
const VIEW_PATH_JOBS: CrmSyncJobName[] = [
  'crm-collectivites-sync',
  'crm-personnes-sync',
  'crm-indicateurs-sync',
  'crm-plans-sync',
];
const DRIZZLE_PATH_JOBS: CrmSyncJobName[] = [
  'crm-droits-sync',
  'crm-labellisations-sync',
];

describe('AirtableCrmSyncService', () => {
  let service: AirtableCrmSyncService;
  let airtableService: { insertRecords: ReturnType<typeof vi.fn> };
  let databaseService: {
    withServiceRole: ReturnType<typeof vi.fn>;
    db: { select: ReturnType<typeof vi.fn> };
  };
  let executedQueries: string[];
  let drizzleSelectRows: unknown[];

  // Mock de chaîne Drizzle : chaque méthode (.from, .innerJoin, .leftJoin,
  // .where, .orderBy, etc.) retourne le même objet thenable, qui se résout
  // à `drizzleSelectRows` quand on l'await.
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
    executedQueries = [];
    drizzleSelectRows = [];

    // Stub de db.transaction utilisé par withServiceRole : pousse les SQL
    // bruts vus par tx.execute dans `executedQueries` pour les inspecter.
    const transactionRunner = async (
      transaction: (tx: {
        execute: <T>(query: { sql?: string; queryChunks?: unknown[] }) => {
          rows: T[];
        };
      }) => unknown
    ) =>
      transaction({
        execute: <T>(query: { sql?: string; queryChunks?: unknown[] }) => {
          // sql.raw() set la chaîne sur queryChunks ; on la reconstitue ici.
          const text =
            query.sql ??
            (query.queryChunks ?? [])
              .map((chunk: unknown) => {
                if (typeof chunk === 'string') return chunk;
                if (
                  chunk &&
                  typeof chunk === 'object' &&
                  'value' in chunk &&
                  Array.isArray((chunk as { value: unknown[] }).value)
                ) {
                  return (chunk as { value: unknown[] }).value.join('');
                }
                return '';
              })
              .join('');
          executedQueries.push(text);
          return { rows: [] as T[] };
        },
      });

    airtableService = { insertRecords: vi.fn().mockResolvedValue([]) };
    databaseService = {
      withServiceRole: vi.fn().mockReturnValue(transactionRunner),
      db: { select: vi.fn().mockImplementation(() => buildDrizzleChain()) },
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

    test('chaque descripteur cible une vue Postgres et une env var Airtable', () => {
      for (const name of Object.keys(CRM_SYNC_JOBS) as CrmSyncJobName[]) {
        const descriptor = CRM_SYNC_JOBS[name];
        expect(descriptor.viewName).toMatch(/^crm_/);
        expect(descriptor.tableIdConfigKey).toMatch(
          /^AIRTABLE_CRM_.*_TABLE_ID$/
        );
        expect(descriptor.mergeFields.length).toBeGreaterThan(0);
        expect(descriptor.cronExpression).toMatch(/^\d+ 6 \* \* \*$/);
        expect(name).toMatch(/^crm-.*-sync$/);
      }
    });

    test('crm-droits-sync utilise une clé composite (collectivite_id, user_id)', () => {
      // Le `key` de la vue crm_droits est un texte concaténé fragile ; la
      // synchro utilise plutôt le tuple stable des deux IDs natifs.
      expect(CRM_SYNC_JOBS['crm-droits-sync'].mergeFields).toEqual([
        'collectivite_id',
        'user_id',
      ]);
    });

    test('crm-plans-sync coerce le `type` nullable en chaîne non nulle pour le merge', () => {
      // crm_plans.type est nullable pour la branche catch-all, ce qui casse
      // l'upsert Airtable (un merge field null insère sans matcher).
      // transformRow remplace null par 'no-type' en place avant l'upsert.
      expect(CRM_SYNC_JOBS['crm-plans-sync'].mergeFields).toEqual(['type']);
      expect(CRM_SYNC_JOBS['crm-plans-sync']).toHaveProperty('transformRow');
    });

    test('chaque job a une fenêtre cron distincte de 06h00 à 06h30', () => {
      const expressions = (
        Object.keys(CRM_SYNC_JOBS) as CrmSyncJobName[]
      ).map((name) => CRM_SYNC_JOBS[name].cronExpression);
      expect(new Set(expressions).size).toBe(expressions.length);
    });
  });

  describe('isCrmSyncJobName', () => {
    test('reconnaît tous les noms de jobs CRM', () => {
      for (const name of Object.keys(CRM_SYNC_JOBS)) {
        expect(isCrmSyncJobName(name)).toBe(true);
      }
    });

    test('rejette les noms non-CRM', () => {
      expect(isCrmSyncJobName('calendly-synchro')).toBe(false);
      expect(isCrmSyncJobName('send-notifications')).toBe(false);
      expect(isCrmSyncJobName('typo-sync')).toBe(false);
    });
  });

  describe('syncTable — chemin "vue + withServiceRole"', () => {
    test('lit la vue Postgres correspondante via withServiceRole', async () => {
      await service.syncTable('crm-collectivites-sync');

      expect(databaseService.withServiceRole).toHaveBeenCalledTimes(1);
      // sql.raw injecte directement le nom de vue dans la requête.
      expect(executedQueries.join('\n')).toMatch(
        /select \* from crm_collectivites/
      );
      // Les jobs view-path n'utilisent PAS le query builder Drizzle.
      expect(databaseService.db.select).not.toHaveBeenCalled();
    });

    test('passe la base id et le table id depuis ConfigurationService à insertRecords', async () => {
      const transactionRunner = async (
        transaction: (tx: { execute: <T>() => { rows: T[] } }) => unknown
      ) =>
        transaction({
          execute: <T>() => ({
            rows: [{ collectivite_id: 1, nom: 'Demo' }] as T[],
          }),
        });
      databaseService.withServiceRole.mockReturnValue(transactionRunner);

      await service.syncTable('crm-collectivites-sync');

      expect(airtableService.insertRecords).toHaveBeenCalledWith(
        'fake-AIRTABLE_IMPORT_DATABASE_ID',
        'fake-AIRTABLE_CRM_COLLECTIVITES_TABLE_ID',
        // Pas de stringification automatique : les merge fields sont
        // envoyés tels que retournés par Postgres. Les descripteurs qui
        // ont besoin d'un cast (ex. crm-indicateurs-sync) le déclarent
        // via `transformRow`.
        [{ fields: { collectivite_id: 1, nom: 'Demo' } }],
        { fieldsToMergeOn: ['collectivite_id'] }
      );
    });

    test('stringifie `id` pour crm-indicateurs-sync (int4 PG → string Airtable)', async () => {
      const transactionRunner = async (
        transaction: (tx: { execute: <T>() => { rows: T[] } }) => unknown
      ) =>
        transaction({
          execute: <T>() => ({
            rows: [{ id: 42, nom: 'Demo', nb_prive: 0 }] as T[],
          }),
        });
      databaseService.withServiceRole.mockReturnValue(transactionRunner);

      await service.syncTable('crm-indicateurs-sync');

      const records = airtableService.insertRecords.mock.calls[0][2];
      expect(records[0].fields.id).toBe('42');
      expect(typeof records[0].fields.id).toBe('string');
    });

    test('coerce `type` nullable en "no-type" en place pour crm-plans-sync', async () => {
      const transactionRunner = async (
        transaction: (tx: { execute: <T>() => { rows: T[] } }) => unknown
      ) =>
        transaction({
          execute: <T>() => ({
            rows: [
              { type: 'foo', nb_plan: 5 },
              { type: null, nb_plan: 1 },
            ] as T[],
          }),
        });
      databaseService.withServiceRole.mockReturnValue(transactionRunner);

      await service.syncTable('crm-plans-sync');

      const records = airtableService.insertRecords.mock.calls[0][2];
      expect(records).toEqual([
        { fields: { type: 'foo', nb_plan: 5 } },
        { fields: { type: 'no-type', nb_plan: 1 } },
      ]);
    });

    test("retourne { inserted: 0 } et n'appelle pas Airtable quand la vue est vide", async () => {
      const result = await service.syncTable('crm-collectivites-sync');

      expect(result).toEqual({ inserted: 0 });
      expect(airtableService.insertRecords).not.toHaveBeenCalled();
    });

    test("propage l'erreur si withServiceRole échoue, sans appeler Airtable", async () => {
      databaseService.withServiceRole.mockReturnValue(async () => {
        throw new Error('DB connection lost');
      });

      await expect(
        service.syncTable('crm-collectivites-sync')
      ).rejects.toThrow('DB connection lost');
      expect(airtableService.insertRecords).not.toHaveBeenCalled();
    });

    test('coerce les colonnes bigint et numeric (oids 20, 1700) en JS number', async () => {
      // node-postgres sérialise bigint et numeric en string par défaut.
      // Airtable refuse une string dans un champ Number. La coercion utilise
      // les OIDs renvoyés dans `result.fields` pour éviter de toucher aux
      // colonnes text qui peuvent contenir des digits (code_siren_insee, etc.).
      const transactionRunner = async (
        transaction: (tx: {
          execute: <T>() => {
            rows: T[];
            fields: ReadonlyArray<{ name: string; dataTypeID: number }>;
          };
        }) => unknown
      ) =>
        transaction({
          execute: <T>() => ({
            rows: [
              {
                type: 'foo',
                nb_plan: '5',
                nb_plan_90pc_FA_privees: '2',
                code_siren_insee: '200034825',
              },
            ] as T[],
            fields: [
              { name: 'type', dataTypeID: 25 }, // text → unchanged
              { name: 'nb_plan', dataTypeID: 20 }, // int8 → coerced
              { name: 'nb_plan_90pc_FA_privees', dataTypeID: 20 }, // int8 → coerced
              { name: 'code_siren_insee', dataTypeID: 25 }, // text → kept as string
            ],
          }),
        });
      databaseService.withServiceRole.mockReturnValue(transactionRunner);

      await service.syncTable('crm-plans-sync');

      const records = airtableService.insertRecords.mock.calls[0][2];
      expect(records[0].fields).toMatchObject({
        nb_plan: 5,
        nb_plan_90pc_FA_privees: 2,
        code_siren_insee: '200034825',
      });
    });
  });

  describe('syncTable — chemin Drizzle direct (droits, labellisations)', () => {
    test('crm-droits-sync passe par databaseService.db.select et NON par withServiceRole', async () => {
      drizzleSelectRows = [
        {
          collectivite_id: 7,
          user_id: 'abcd-1234',
          niveau_acces: 'admin',
        },
      ];

      await service.syncTable('crm-droits-sync');

      expect(databaseService.db.select).toHaveBeenCalled();
      expect(databaseService.withServiceRole).not.toHaveBeenCalled();
    });

    test('crm-labellisations-sync passe par databaseService.db.select et NON par withServiceRole', async () => {
      drizzleSelectRows = [
        { id: 1, referentiel: 'cae', etoiles: 3 },
      ];

      await service.syncTable('crm-labellisations-sync');

      expect(databaseService.db.select).toHaveBeenCalled();
      expect(databaseService.withServiceRole).not.toHaveBeenCalled();
    });

    test('crm-droits-sync renvoie les merge fields tels quels (pas de transformRow déclaré)', async () => {
      // Avec la suppression de la stringification automatique, les types
      // natifs de Postgres atteignent Airtable inchangés. Si un descripteur
      // a besoin d'un cast (ex. crm-indicateurs-sync), il le déclare via
      // `transformRow`.
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

    test('crm-labellisations-sync envoie id en number (champ Airtable typé Number, pas de transformRow)', async () => {
      // Le champ id côté Airtable est typé Number sur cette table : on doit
      // l'envoyer en number, pas en string. Comme la stringification
      // automatique a été supprimée et que ce descripteur ne déclare pas de
      // transformRow, id reste un number tel que renvoyé par Postgres.
      drizzleSelectRows = [{ id: 42, etoiles: 3, referentiel: 'cae' }];

      await service.syncTable('crm-labellisations-sync');

      const records = airtableService.insertRecords.mock.calls[0][2];
      expect(records[0].fields.id).toBe(42); // number, pas '42'
      expect(typeof records[0].fields.id).toBe('number');
    });

    test('utilise les merge fields composites pour crm-droits-sync', async () => {
      drizzleSelectRows = [{ collectivite_id: 1, user_id: 'abc' }];

      await service.syncTable('crm-droits-sync');

      expect(airtableService.insertRecords).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        { fieldsToMergeOn: ['collectivite_id', 'user_id'] }
      );
    });

    test("propage l'erreur si insertRecords échoue (chemin Drizzle)", async () => {
      drizzleSelectRows = [{ id: 1 }];
      airtableService.insertRecords.mockRejectedValue(
        new Error('Airtable down')
      );

      await expect(
        service.syncTable('crm-labellisations-sync')
      ).rejects.toThrow('Airtable down');
    });

    test("retourne { inserted: 0 } et n'appelle pas Airtable quand le SELECT Drizzle est vide", async () => {
      drizzleSelectRows = [];

      const result = await service.syncTable('crm-droits-sync');

      expect(result).toEqual({ inserted: 0 });
      expect(airtableService.insertRecords).not.toHaveBeenCalled();
    });
  });

  describe('syncTable across all jobs', () => {
    test.each(VIEW_PATH_JOBS)(
      'job view-path "%s" appelle insertRecords avec les bons arguments',
      async (jobName) => {
        const transactionRunner = async (
          transaction: (tx: { execute: <T>() => { rows: T[] } }) => unknown
        ) =>
          transaction({
            execute: <T>() => ({ rows: [{ id: 1, type: 'foo' }] as T[] }),
          });
        databaseService.withServiceRole.mockReturnValue(transactionRunner);

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

    test.each(DRIZZLE_PATH_JOBS)(
      'job Drizzle-path "%s" appelle insertRecords avec les bons arguments',
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
  });
});
