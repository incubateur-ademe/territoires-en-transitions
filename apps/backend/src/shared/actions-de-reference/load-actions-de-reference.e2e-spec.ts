import { INestApplication } from '@nestjs/common';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  PgDataException,
  PgIntegrityConstraintViolation,
  PgSyntaxErrorOrAccessRuleViolation,
} from '@tet/backend/utils/postgresql-error-codes.enum';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { actionDeReferenceSchema } from '@tet/domain/shared';
import { sql, SQL } from 'drizzle-orm';
import { TransactionRollbackError } from 'drizzle-orm/errors';
import { omitBy } from 'es-toolkit';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';
import * as z from 'zod/mini';
import { actionDeReferenceTable } from './models/action-de-reference.table';

const loadedActionsSchema = z.array(
  z.omit(actionDeReferenceSchema, { id: true })
);

type LoadedAction = z.output<typeof loadedActionsSchema>[number];

type ScratchActionTable = {
  table: SQL;
  runLoadFile: () => Promise<void>;
};

const execFileAsync = promisify(execFile);

const LOAD_FILE_PATH = path.resolve(
  __dirname,
  '../../../../../data_layer/seed/content/31-actions-de-reference.sql'
);

const PSQL_SCRIPT_ERROR_EXIT_CODE = 3;

const PSQL_TIMEOUT_IN_MS = 5_000;

const toPsqlConnectionEnv = (databaseUrl: string): Record<string, string> => {
  const url = new URL(databaseUrl);
  const connectionEnv = {
    PGHOST: url.hostname,
    PGPORT: url.port,
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
  };
  const sslMode = url.searchParams.get('sslmode');
  if (sslMode === null) {
    return connectionEnv;
  }
  return { ...connectionEnv, PGSSLMODE: sslMode };
};

const isLibpqVariable = (_value: unknown, name: PropertyKey): boolean =>
  String(name).startsWith('PG');

const TEST_TITRE_PREFIX = 'load-actions-de-reference-e2e';

const toTestTitre = (suffix: string): string =>
  `${TEST_TITRE_PREFIX} ${suffix}`;

describe('load-data', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let databaseUrl: string;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    databaseUrl = app.get(ConfigurationService).get('SUPABASE_DATABASE_URL');

    return async (): Promise<void> => {
      await app.close();
    };
  });

  const runInRolledBackTransaction = async (
    write: (tx: Transaction) => Promise<void>
  ): Promise<void> => {
    try {
      await db.db.transaction(async (tx) => {
        await write(tx);
        tx.rollback();
      });
    } catch (error) {
      if (!(error instanceof TransactionRollbackError)) {
        throw error;
      }
    }
  };

  const insertRawAction = (values: {
    titre: SQL;
    description: SQL;
    levier: SQL;
    categorie: SQL;
  }): Promise<void> =>
    db.db.transaction(async (tx) => {
      await tx.execute(
        sql`insert into action_de_reference (titre, description, levier, categorie)
            values (${values.titre}, ${values.description}, ${values.levier}, ${values.categorie})`
      );
      tx.rollback();
    });

  const validRawValues = {
    titre: sql`${toTestTitre('valide')}`,
    description: sql`${'une description'}`,
    levier: sql`'sobriete_batiments_residentiel'`,
    categorie: sql`'amenagement'`,
  };

  const runLoadFileWithPsql = async (searchedSchema: string): Promise<void> => {
    await execFileAsync(
      'psql',
      [
        '--no-psqlrc',
        '--quiet',
        '--set',
        'VERBOSITY=verbose',
        '--file',
        LOAD_FILE_PATH,
      ],
      {
        env: {
          ...omitBy(process.env, isLibpqVariable),
          ...toPsqlConnectionEnv(databaseUrl),
          PGOPTIONS: `-c search_path=${searchedSchema}`,
        },
        timeout: PSQL_TIMEOUT_IN_MS,
        killSignal: 'SIGKILL',
      }
    );
  };

  const createScratchSchema = async (): Promise<string> => {
    const scratchSchema = `load_actions_de_reference_${
      process.pid
    }_${Date.now()}`;
    await db.db.execute(sql`create schema ${sql.identifier(scratchSchema)}`);
    onTestFinished(async () => {
      await db.db.execute(
        sql`drop schema ${sql.identifier(scratchSchema)} cascade`
      );
    });
    return scratchSchema;
  };

  const createScratchActionTable = async (): Promise<ScratchActionTable> => {
    const scratchSchema = await createScratchSchema();
    const table = sql`${sql.identifier(scratchSchema)}.action_de_reference`;
    await db.db.execute(
      sql`create table ${table} (like ${actionDeReferenceTable} including all)`
    );
    return {
      table,
      runLoadFile: () => runLoadFileWithPsql(scratchSchema),
    };
  };

  const listActionsOf = async (table: SQL): Promise<LoadedAction[]> => {
    const { rows } = await db.db.execute(
      sql`select titre, description, levier, categorie from ${table}`
    );
    return loadedActionsSchema.parse(rows);
  };

  it('le seed local et CI remplit la table avec chaque ligne du fichier de chargement', async () => {
    const { table, runLoadFile } = await createScratchActionTable();

    await runLoadFile();
    const loadedActions = await listActionsOf(table);
    const seededActions = await db.db
      .select({
        titre: actionDeReferenceTable.titre,
        description: actionDeReferenceTable.description,
        levier: actionDeReferenceTable.levier,
        categorie: actionDeReferenceTable.categorie,
      })
      .from(actionDeReferenceTable);

    expect(loadedActions).not.toHaveLength(0);
    expect(seededActions).toEqual(expect.arrayContaining(loadedActions));
  });

  it('la table refuse une seconde action avec le même levier, la même catégorie et le même titre', async () => {
    const action = {
      titre: toTestTitre('doublon'),
      description: 'une description',
      levier: 'sobriete_batiments_residentiel',
      categorie: 'amenagement',
    } as const;

    await runInRolledBackTransaction(async (tx) => {
      await tx.insert(actionDeReferenceTable).values(action);

      await expect(
        tx
          .insert(actionDeReferenceTable)
          .values({ ...action, description: 'une autre description' })
      ).rejects.toMatchObject({
        cause: {
          code: PgIntegrityConstraintViolation.UniqueViolation,
          constraint: 'action_de_reference_unique',
        },
      });
    });
  });

  it('la table refuse un titre ou une description absent', async () => {
    await expect(
      insertRawAction({ ...validRawValues, titre: sql`null` })
    ).rejects.toMatchObject({
      cause: {
        code: PgIntegrityConstraintViolation.NotNullViolation,
        column: 'titre',
      },
    });
    await expect(
      insertRawAction({ ...validRawValues, description: sql`null` })
    ).rejects.toMatchObject({
      cause: {
        code: PgIntegrityConstraintViolation.NotNullViolation,
        column: 'description',
      },
    });
  });

  it("la table refuse un titre ou une description vide, fait d'espaces ou entouré d'espaces", async () => {
    const blankTexts = [
      '',
      '   ',
      '\t',
      ` ${toTestTitre('entouré')} `,
      `${toTestTitre("suivi d'un retour à la ligne")}\n`,
      `${toTestTitre("suivi d'une espace insécable")}\u00a0`,
    ];

    await Promise.all(
      blankTexts.flatMap((blankText, index) => [
        expect(
          insertRawAction({ ...validRawValues, titre: sql`${blankText}` })
        ).rejects.toMatchObject({
          cause: {
            code: PgIntegrityConstraintViolation.CheckViolation,
            constraint: 'action_de_reference_titre_non_vide',
          },
        }),
        expect(
          insertRawAction({
            ...validRawValues,
            titre: sql`${toTestTitre(`description ${index}`)}`,
            description: sql`${blankText}`,
          })
        ).rejects.toMatchObject({
          cause: {
            code: PgIntegrityConstraintViolation.CheckViolation,
            constraint: 'action_de_reference_description_non_vide',
          },
        }),
      ])
    );
  });

  it('la table refuse un titre de plus de 300 caractères', async () => {
    await expect(
      insertRawAction({ ...validRawValues, titre: sql`${'a'.repeat(301)}` })
    ).rejects.toMatchObject({
      cause: {
        code: PgIntegrityConstraintViolation.CheckViolation,
        constraint: 'action_de_reference_titre_longueur_max',
      },
    });
  });

  it("la table refuse un titre de 300 caractères suivi d'espaces au lieu de le tronquer", async () => {
    await expect(
      insertRawAction({
        ...validRawValues,
        titre: sql`${`${'a'.repeat(300)}   `}`,
      })
    ).rejects.toMatchObject({
      cause: {
        code: PgIntegrityConstraintViolation.CheckViolation,
        constraint: 'action_de_reference_titre_longueur_max',
      },
    });
  });

  it('la table accepte un titre de 300 caractères hors du plan multilingue de base, comme le schéma du domaine', async () => {
    await runInRolledBackTransaction(async (tx) => {
      await expect(
        tx
          .insert(actionDeReferenceTable)
          .values({
            titre: '😀'.repeat(300),
            description: 'une description',
            levier: 'sobriete_batiments_residentiel',
            categorie: 'amenagement',
          })
          .returning({ id: actionDeReferenceTable.id })
      ).resolves.toEqual([{ id: expect.any(Number) }]);
    });
  });

  it('la table refuse un levier ou une catégorie hors liste', async () => {
    await expect(
      insertRawAction({ ...validRawValues, levier: sql`'levier_inconnu'` })
    ).rejects.toMatchObject({
      cause: { code: PgDataException.InvalidTextRepresentation },
    });
    await expect(
      insertRawAction({
        ...validRawValues,
        categorie: sql`'categorie_inconnue'`,
      })
    ).rejects.toMatchObject({
      cause: { code: PgDataException.InvalidTextRepresentation },
    });
  });

  it("rejouer le fichier de chargement sur une table qui contient déjà une de ses lignes échoue et n'ajoute aucune ligne", async () => {
    const { table, runLoadFile } = await createScratchActionTable();

    await runLoadFile();
    await db.db.execute(
      sql`delete from ${table} where id <> (select max(id) from ${table})`
    );
    const [lastLoadedAction] = await listActionsOf(table);

    await expect(runLoadFile()).rejects.toMatchObject({
      code: PSQL_SCRIPT_ERROR_EXIT_CODE,
      stderr: expect.stringContaining(
        PgIntegrityConstraintViolation.UniqueViolation
      ),
    });
    expect(await listActionsOf(table)).toEqual([lastLoadedAction]);
  });

  it("le chargement du test échoue sur la table absente du schéma jetable au lieu d'écrire dans la table publique", async () => {
    const scratchSchemaWithoutTable = await createScratchSchema();

    await expect(
      runLoadFileWithPsql(scratchSchemaWithoutTable)
    ).rejects.toMatchObject({
      code: PSQL_SCRIPT_ERROR_EXIT_CODE,
      stderr: expect.stringContaining(
        PgSyntaxErrorOrAccessRuleViolation.UndefinedTable
      ),
    });
  });
});
