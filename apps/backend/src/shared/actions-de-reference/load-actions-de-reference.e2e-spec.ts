import { INestApplication } from '@nestjs/common';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  PgDataException,
  PgIntegrityConstraintViolation,
} from '@tet/backend/utils/postgresql-error-codes.enum';
import { sql, SQL } from 'drizzle-orm';
import { TransactionRollbackError } from 'drizzle-orm/errors';
import { beforeAll, describe, expect, it } from 'vitest';
import { actionDeReferenceTable } from './models/action-de-reference.table';

const TEST_TITRE_PREFIX = 'load-actions-de-reference-e2e';

const toTestTitre = (suffix: string): string =>
  `${TEST_TITRE_PREFIX} ${suffix}`;

describe('load-data', () => {
  let app: INestApplication;
  let db: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);

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

  it.todo(
    'le seed local et CI remplit la table avec chaque ligne du fichier de chargement'
  );

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

  it.todo(
    "rejouer le fichier de chargement sur une table qui contient déjà une de ses lignes échoue et n'ajoute aucune ligne"
  );
});
