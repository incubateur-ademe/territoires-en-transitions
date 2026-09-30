import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { notImplemented } from '@tet/backend/utils/not-implemented';
import { failure, success } from '@tet/backend/utils/result.type';
import { ListActionsDeReferenceInput } from '@tet/domain/shared';
import { getErrorMessage } from '@tet/domain/utils';
import { and, asc, inArray, or, SQL, sql } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { match } from 'ts-pattern';
import { ActionsDeReferenceErrorEnum } from './actions-de-reference.errors';
import { ActionsDeReferenceRepository } from './actions-de-reference.repository';
import { actionDeReferenceTable } from './models/action-de-reference.table';

const containsSearchedText = (column: PgColumn, searchedText: string): SQL =>
  sql`strpos(lower(unaccent(${column})), lower(unaccent(${searchedText}))) > 0`;

const ascendingByIdentifier = (column: PgColumn): SQL =>
  asc(sql`${column}::text collate "C"`);

const toMatchingCondition = (
  input: ListActionsDeReferenceInput
): SQL | undefined => {
  const titreCondition =
    input.titre === undefined
      ? undefined
      : containsSearchedText(actionDeReferenceTable.titre, input.titre);
  const descriptionCondition =
    input.description === undefined
      ? undefined
      : containsSearchedText(
          actionDeReferenceTable.description,
          input.description
        );
  const leviersCondition =
    input.leviers === undefined
      ? undefined
      : inArray(actionDeReferenceTable.levier, input.leviers);
  const categoriesCondition =
    input.categories === undefined
      ? undefined
      : inArray(actionDeReferenceTable.categorie, input.categories);

  return and(
    titreCondition,
    descriptionCondition,
    or(leviersCondition, categoriesCondition)
  );
};

const toOrderBy = (sortBy: ListActionsDeReferenceInput['sortBy']): SQL[] =>
  match(sortBy)
    .with('titre', () => [
      asc(actionDeReferenceTable.titre),
      ascendingByIdentifier(actionDeReferenceTable.levier),
      ascendingByIdentifier(actionDeReferenceTable.categorie),
    ])
    .with('levier', () => [
      ascendingByIdentifier(actionDeReferenceTable.levier),
      asc(actionDeReferenceTable.titre),
      ascendingByIdentifier(actionDeReferenceTable.categorie),
    ])
    .with('categorie', () => [
      ascendingByIdentifier(actionDeReferenceTable.categorie),
      asc(actionDeReferenceTable.titre),
      ascendingByIdentifier(actionDeReferenceTable.levier),
    ])
    .exhaustive();

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
        .select({
          id: actionDeReferenceTable.id,
          titre: actionDeReferenceTable.titre,
          description: actionDeReferenceTable.description,
          levier: actionDeReferenceTable.levier,
          categorie: actionDeReferenceTable.categorie,
        })
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

  update: ActionsDeReferenceRepository['update'] = notImplemented('update');
}
