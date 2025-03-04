import { DatabaseService } from '@/backend/utils';
import { Injectable } from '@nestjs/common';
import { and, asc, eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import z from 'zod';
import {
  actionDefinitionTable,
  actionTypeSchema,
  ReferentielIdEnum,
} from '../index-domain';
import { referentielDefinitionTable } from '../models/referentiel-definition.table';

export const inputSchema = z.object({
  actionIds: z.string().array().optional(),
  actionTypes: actionTypeSchema.array().optional(),
});

type Input = z.infer<typeof inputSchema>;

export type ActionDefinition = Awaited<
  ReturnType<ListActionDefinitionsService['listActionDefinitions']>
>[0];

// TODO maybe see PG view `action_hierachy` to get children and parents

@Injectable()
export class ListActionDefinitionsService {
  constructor(private readonly databaseService: DatabaseService) {}

  private db = this.databaseService.db;

  async listActionDefinitions({ actionIds, actionTypes }: Input) {
    const subQuery = this.db
      .$with('action_definition_with_depth_and_type')
      .as(this.listWithDepthAndType());

    const request = this.db.with(subQuery).select().from(subQuery);

    const filters = [
      // On inclut uniquement les actions des référentiels CAE et ECI pour le moment
      inArray(subQuery.referentielId, [
        ReferentielIdEnum.CAE,
        ReferentielIdEnum.ECI,
      ]),
    ];

    if (actionIds?.length) {
      filters.push(inArray(subQuery.actionId, actionIds));
    }

    if (actionTypes?.length) {
      filters.push(inArray(subQuery.actionType, actionTypes));
    }

    if (filters.length) {
      request.where(and(...filters));
    }

    request.orderBy(asc(subQuery.actionId));

    return request;
  }

  private listWithDepth() {
    return this.db
      .select({
        ...getTableColumns(actionDefinitionTable),

        // Add a column with the depth of the action depending on the number of dots in the identifiant
        // Ex: 1.1   => depth 2
        //     1.1.1 => depth 3
        depth: sql`CASE
          WHEN ${actionDefinitionTable.identifiant} IS NULL OR ${actionDefinitionTable.identifiant} LIKE '' THEN 0
          ELSE REGEXP_COUNT(${actionDefinitionTable.identifiant}, '\\.') + 1
          END`.as('depth'),
      })
      .from(actionDefinitionTable);
  }

  private listWithDepthAndType() {
    const subQuery = this.db
      .$with('action_definition_with_depth')
      .as(this.listWithDepth());

    return this.db
      .with(subQuery)
      .select({
        modifiedAt: subQuery.modifiedAt,
        actionId: subQuery.actionId,
        referentiel: subQuery.referentiel,
        identifiant: subQuery.identifiant,
        nom: subQuery.nom,
        description: subQuery.description,
        contexte: subQuery.contexte,
        exemples: subQuery.exemples,
        ressources: subQuery.ressources,
        reductionPotentiel: subQuery.reductionPotentiel,
        perimetreEvaluation: subQuery.perimetreEvaluation,
        preuve: subQuery.preuve,
        points: subQuery.points,
        pourcentage: subQuery.pourcentage,
        categorie: subQuery.categorie,
        referentielId: subQuery.referentielId,
        referentielVersion: subQuery.referentielVersion,

        depth: subQuery.depth,

        // Add the action type from the `referentiel_definition.hierarchie` array
        // Ex: 'axe', 'sous-axe', etc
        actionType:
          sql`${referentielDefinitionTable.hierarchie}[${subQuery.depth} + 1]`.as(
            'actionType'
          ),
      })
      .from(subQuery)
      .innerJoin(
        referentielDefinitionTable,
        and(
          eq(referentielDefinitionTable.id, subQuery.referentielId),
          eq(referentielDefinitionTable.version, subQuery.referentielVersion)
        )
      );
  }
}
