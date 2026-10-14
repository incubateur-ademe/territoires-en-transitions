import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { isUniqueViolation } from '@tet/backend/utils/nest/errors.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  ActionDeReferenceChanges,
  ActionDeReferenceId,
  ListActionsDeReferenceInput,
  UpdateActionDeReferenceOutput,
} from '@tet/domain/shared';
import { getErrorMessage } from '@tet/domain/utils';
import { and, asc, eq, or, SQL, sql } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { isUndefined, omitBy } from 'es-toolkit';
import { match } from 'ts-pattern';
import {
  ActionsDeReferenceErrorEnum,
  UpdateActionDeReferenceRepositoryError,
} from './actions-de-reference.errors';
import { ActionsDeReferenceRepository } from './actions-de-reference.repository';
import { actionDeReferenceTable } from './models/action-de-reference.table';

const selectedActionColumns = {
  id: actionDeReferenceTable.id,
  titre: actionDeReferenceTable.titre,
  description: actionDeReferenceTable.description,
  leviers: actionDeReferenceTable.leviers,
  categories: actionDeReferenceTable.categories,
};

const containsSearchedText = (column: PgColumn, searchedText: string): SQL =>
  sql`strpos(lower(unaccent(${column})), lower(unaccent(${searchedText}))) > 0`;

const ascendingByFirstElement = (column: PgColumn): SQL =>
  asc(sql`(${column}[1])::text collate "C"`);

const leviersLiteral = (leviers: readonly string[]): SQL =>
  sql`ARRAY[${sql.join(
    leviers.map((levier) => sql`${levier}`),
    sql`, `
  )}]::levier_ges_id[]`;

const categoriesLiteral = (categories: readonly string[]): SQL =>
  sql`ARRAY[${sql.join(
    categories.map((categorie) => sql`${categorie}`),
    sql`, `
  )}]::volet_categorie[]`;

const toMatchingCondition = (
  input: ListActionsDeReferenceInput
): SQL | undefined => {
  const searchedTextCondition =
    input.searchedText === undefined
      ? undefined
      : or(
          containsSearchedText(
            actionDeReferenceTable.titre,
            input.searchedText
          ),
          containsSearchedText(
            actionDeReferenceTable.description,
            input.searchedText
          )
        );
  const leviersCondition =
    input.leviers === undefined
      ? undefined
      : sql`${actionDeReferenceTable.leviers} && ${leviersLiteral(
          input.leviers
        )}`;
  const categoriesCondition =
    input.categories === undefined
      ? undefined
      : sql`${actionDeReferenceTable.categories} && ${categoriesLiteral(
          input.categories
        )}`;

  return and(searchedTextCondition, or(leviersCondition, categoriesCondition));
};

const toOrderBy = (sortBy: ListActionsDeReferenceInput['sortBy']): SQL[] =>
  match(sortBy)
    .with('titre', () => [
      asc(actionDeReferenceTable.titre),
      ascendingByFirstElement(actionDeReferenceTable.leviers),
      ascendingByFirstElement(actionDeReferenceTable.categories),
    ])
    .with('leviers', () => [
      ascendingByFirstElement(actionDeReferenceTable.leviers),
      asc(actionDeReferenceTable.titre),
      ascendingByFirstElement(actionDeReferenceTable.categories),
    ])
    .with('categories', () => [
      ascendingByFirstElement(actionDeReferenceTable.categories),
      asc(actionDeReferenceTable.titre),
      ascendingByFirstElement(actionDeReferenceTable.leviers),
    ])
    .exhaustive();

const toUpdateOutput = (
  matchingRows: readonly UpdateActionDeReferenceOutput[]
): Result<
  UpdateActionDeReferenceOutput,
  UpdateActionDeReferenceRepositoryError
> => {
  const [matchingRow] = matchingRows;
  if (matchingRow === undefined) {
    return failure(ActionsDeReferenceErrorEnum.ACTION_DE_REFERENCE_NOT_FOUND);
  }
  return success({ id: matchingRow.id });
};

@Injectable()
export class ActionsDeReferenceTableRepository extends ActionsDeReferenceRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(ActionsDeReferenceTableRepository.name);

  constructor(private readonly database: DatabaseService) {
    super();
  }

  list: ActionsDeReferenceRepository['list'] = async (input) => {
    try {
      const actions = await this.db
        .select(selectedActionColumns)
        .from(actionDeReferenceTable)
        .where(toMatchingCondition(input))
        .orderBy(...toOrderBy(input.sortBy));
      return success(actions);
    } catch (error) {
      this.logger.error(
        `Could not list the actions de référence: ${getErrorMessage(error)}`
      );
      return failure(ActionsDeReferenceErrorEnum.DATABASE_ERROR);
    }
  };

  get: ActionsDeReferenceRepository['get'] = async ({ id }) => {
    try {
      const [action] = await this.db
        .select(selectedActionColumns)
        .from(actionDeReferenceTable)
        .where(eq(actionDeReferenceTable.id, id));
      if (action === undefined) {
        return failure(
          ActionsDeReferenceErrorEnum.ACTION_DE_REFERENCE_NOT_FOUND
        );
      }
      return success(action);
    } catch (error) {
      this.logger.error(
        `Could not get the action de référence ${id}: ${getErrorMessage(error)}`
      );
      return failure(ActionsDeReferenceErrorEnum.DATABASE_ERROR);
    }
  };

  update: ActionsDeReferenceRepository['update'] = async ({
    id,
    changes,
    tx,
  }) => {
    const definedChanges = omitBy(changes, isUndefined);
    const hasNoChange = Object.keys(definedChanges).length === 0;

    try {
      if (hasNoChange) {
        return toUpdateOutput(await this.selectActionId({ id, tx }));
      }
      return toUpdateOutput(
        await this.updateActionReturningId({
          id,
          changes: definedChanges,
          tx,
        })
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        return failure(
          ActionsDeReferenceErrorEnum.ACTION_DE_REFERENCE_CONFLICT
        );
      }
      this.logger.error(
        `Could not update the action de référence ${id}: ${getErrorMessage(
          error
        )}`
      );
      return failure(ActionsDeReferenceErrorEnum.DATABASE_ERROR);
    }
  };

  private selectActionId({
    id,
    tx,
  }: {
    id: ActionDeReferenceId;
    tx?: Transaction;
  }): Promise<UpdateActionDeReferenceOutput[]> {
    return (tx ?? this.db)
      .select({ id: actionDeReferenceTable.id })
      .from(actionDeReferenceTable)
      .where(eq(actionDeReferenceTable.id, id));
  }

  private updateActionReturningId({
    id,
    changes,
    tx,
  }: {
    id: ActionDeReferenceId;
    changes: ActionDeReferenceChanges;
    tx?: Transaction;
  }): Promise<UpdateActionDeReferenceOutput[]> {
    return (tx ?? this.db).transaction((updateTx) =>
      updateTx
        .update(actionDeReferenceTable)
        .set(changes)
        .where(eq(actionDeReferenceTable.id, id))
        .returning({ id: actionDeReferenceTable.id })
    );
  }
}
