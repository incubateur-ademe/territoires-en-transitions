import { Injectable, Logger } from '@nestjs/common';
import { preuveActionTable } from '@tet/backend/collectivites/documents/models/preuve-action.table';
import { preuveReglementaireDefinitionTable } from '@tet/backend/collectivites/documents/models/preuve-reglementaire-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ActionDefinition, ReferentielId } from '@tet/domain/referentiels';
import { and, asc, eq, getTableColumns, ilike, sql } from 'drizzle-orm';
import { actionOrigineTable } from '../correlated-actions/action-origine.table';
import { actionOrigineTexteTable } from '../correlated-actions/action-origine-texte.table';
import { GetActionOrigineDtoSchema } from '../correlated-actions/get-action-origine.dto';
import { GetActionOrigineTexteDtoSchema } from '../correlated-actions/get-action-origine-texte.dto';
import { actionDefinitionTagTable } from '../models/action-definition-tag.table';
import { actionDefinitionTable } from '../models/action-definition.table';
import { actionRelationTable } from '../models/action-relation.table';

export type ActionDefinitionAvecParent = Pick<
  ActionDefinition,
  'actionId' | 'points'
> &
  Partial<ActionDefinition> & {
    parentActionId: string | null;
  };

@Injectable()
export class GetReferentielRepository {
  private readonly logger = new Logger(GetReferentielRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getActionsOrigine(
    referentielId: ReferentielId
  ): Promise<GetActionOrigineDtoSchema[]> {
    return await this.databaseService.db
      .select({
        ...getTableColumns(actionOrigineTable),
        origineActionNom: actionDefinitionTable.nom,
      })
      .from(actionOrigineTable)
      .leftJoin(
        actionDefinitionTable,
        eq(actionOrigineTable.origineActionId, actionDefinitionTable.actionId)
      )
      .where(
        eq(actionOrigineTable.referentielId, referentielId as ReferentielId)
      )
      .orderBy(asc(actionOrigineTable.actionId));
  }

  async getActionsOrigineTexte(
    referentielId: ReferentielId
  ): Promise<GetActionOrigineTexteDtoSchema[]> {
    return await this.databaseService.db
      .select({
        ...getTableColumns(actionOrigineTexteTable),
        origineActionNom: actionDefinitionTable.nom,
      })
      .from(actionOrigineTexteTable)
      .leftJoin(
        actionDefinitionTable,
        eq(
          actionOrigineTexteTable.origineActionId,
          actionDefinitionTable.actionId
        )
      )
      .where(
        eq(
          actionOrigineTexteTable.referentielId,
          referentielId as ReferentielId
        )
      )
      .orderBy(asc(actionOrigineTexteTable.actionId));
  }

  private getActionDefinitionTags() {
    return this.databaseService.db
      .select({
        actionId: actionDefinitionTagTable.actionId,
        referentielId: actionDefinitionTagTable.referentielId,
        tags: sql`array_agg(${actionDefinitionTagTable.tagRef})`.as('tags'),
      })
      .from(actionDefinitionTagTable)
      .groupBy(
        actionDefinitionTagTable.actionId,
        actionDefinitionTagTable.referentielId
      )
      .as('action_tags');
  }

  private getActionPreuves(referentielId: ReferentielId) {
    return this.databaseService.db
      .select({
        actionId: preuveActionTable.actionId,
        preuves: sql<
          { preuveId: number }[]
        >`array_agg(json_build_object('preuveId', ${preuveReglementaireDefinitionTable.id}))`.as(
          'preuves'
        ),
      })
      .from(preuveActionTable)
      .leftJoin(
        preuveReglementaireDefinitionTable,
        eq(preuveActionTable.preuveId, preuveReglementaireDefinitionTable.id)
      )
      .where(ilike(preuveActionTable.actionId, `${referentielId}%`))
      .groupBy(preuveActionTable.actionId)
      .as('action_preuves');
  }

  async getActionDefinitionsWithParent(
    referentielId: ReferentielId,
    referentielVersion: string,
    {
      withSelectColumns,
      withPreuves,
    }: {
      withSelectColumns: 'essential' | 'all';
      withPreuves?: boolean;
    }
  ): Promise<ActionDefinitionAvecParent[]> {
    const tagsSubQuery = this.getActionDefinitionTags();
    const preuvesSubQuery = this.getActionPreuves(referentielId);

    const selectColumns =
      withSelectColumns === 'essential'
        ? {
            actionId: actionDefinitionTable.actionId,
            identifiant: actionDefinitionTable.identifiant,
            nom: actionDefinitionTable.nom,
            points: actionDefinitionTable.points,
            categorie: actionDefinitionTable.categorie,
            pourcentage: actionDefinitionTable.pourcentage,
          }
        : getTableColumns(actionDefinitionTable);

    const query = this.databaseService.db
      .select({
        ...selectColumns,
        parentActionId: actionRelationTable.parent,
        tags: tagsSubQuery.tags,
        preuves: withPreuves ? preuvesSubQuery.preuves : sql`null`,
      })
      .from(actionDefinitionTable)
      .leftJoin(
        actionRelationTable,
        eq(actionDefinitionTable.actionId, actionRelationTable.id)
      )
      .leftJoin(
        tagsSubQuery,
        and(
          eq(actionDefinitionTable.actionId, tagsSubQuery.actionId),
          eq(actionDefinitionTable.referentielId, tagsSubQuery.referentielId)
        )
      );

    if (withPreuves) {
      query.leftJoin(
        preuvesSubQuery,
        eq(actionDefinitionTable.actionId, preuvesSubQuery.actionId)
      );
    }

    query
      .where(
        and(
          eq(actionDefinitionTable.referentielId, referentielId),
          eq(actionDefinitionTable.referentielVersion, referentielVersion)
        )
      )
      .orderBy(
        asc(
          sql`${actionDefinitionTable.actionId} collate numeric_with_case_and_accent_insensitive`
        )
      );

    this.logger.log(`Query: ${JSON.stringify(query.toSQL())}`);

    return await query;
  }
}
