import { Injectable } from '@nestjs/common';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { questionActionTable } from '@tet/backend/referentiels/models/question-action.table';
import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { CommonError } from '@tet/backend/utils/trpc/common-errors';
import {
  ActionStaticDefinition,
  ActionThematique,
  ActionType,
  ListActionDefinitionsOutput,
  ReferentielLabel,
  ReferentielLabelEnum,
  ReferentielTagTypeEnum,
} from '@tet/domain/referentiels';
import { and, asc, eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import { ImportActionDefinitionCoremeasureType } from '../import-referentiel/import-action-definition.dto';
import { actionDefinitionTagTable } from '../models/action-definition-tag.table';
import { actionDepth } from '../models/action-depth.column';
import { referentielDefinitionTable } from '../models/referentiel-definition.table';
import { referentielTagTable } from '../models/referentiel-tag.table';
import { ListActionDefinitionsInput } from './list-action-definitions.input';

/**
 * Liste les définitions des actions d'un référentiel (partie statique de
 * `listActionsGroupedById`). Elles ne changent qu'à la publication d'une
 * nouvelle version du référentiel.
 */
@Injectable()
export class ListActionDefinitionsService {
  constructor(private readonly databaseService: DatabaseService) {}

  private db = this.databaseService.db;

  async listActionDefinitions({
    referentielId,
  }: ListActionDefinitionsInput): Promise<
    Result<ListActionDefinitionsOutput, CommonError>
  > {
    // Les deux lectures partagent le même instantané : la version renvoyée
    // correspond toujours aux définitions, même si une nouvelle version est
    // publiée entre les deux requêtes.
    return this.db.transaction(
      async (tx) => {
        const [referentiel] = await tx
          .select({ version: referentielDefinitionTable.version })
          .from(referentielDefinitionTable)
          .where(eq(referentielDefinitionTable.id, referentielId));

        if (!referentiel) {
          return failure('NOT_FOUND');
        }

        const definitions: ActionStaticDefinition[] = await tx
          .select({
            ...getTableColumns(actionDefinitionTable),
            modifiedAt: sqlToDateTimeISO(actionDefinitionTable.modifiedAt),
            depth: actionDepth.as('depth'),

            // Type d'action d'après `referentiel_definition.hierarchie`
            // Ex: 'axe', 'sous-axe', etc
            actionType:
              sql<ActionType>`${referentielDefinitionTable.hierarchie}[${actionDepth} + 1]`.as(
                'actionType'
              ),

            questionIds: sql<Array<string>>`
              COALESCE(
                (
                  SELECT array_to_json(
                    array_agg(DISTINCT ${questionActionTable.questionId})
                  )
                  FROM ${questionActionTable}
                  WHERE ${eq(
                    questionActionTable.actionId,
                    actionDefinitionTable.actionId
                  )}
                ),
                '[]'::json
              )
            `.as('questionIds'),

            labels: sql<Array<ReferentielLabel>>`
              COALESCE(
                (
                  SELECT array_to_json(
                    array_agg(DISTINCT ${actionDefinitionTagTable.tagRef})
                  )
                  FROM ${actionDefinitionTagTable}
                  WHERE ${and(
                    eq(
                      actionDefinitionTagTable.actionId,
                      actionDefinitionTable.actionId
                    ),
                    eq(
                      actionDefinitionTagTable.referentielId,
                      actionDefinitionTable.referentielId
                    ),
                    inArray(actionDefinitionTagTable.tagRef, [
                      ReferentielLabelEnum.TE_CAE,
                      ReferentielLabelEnum.TE_ECI,
                    ])
                  )}
                ),
                '[]'::json
              )
            `.as('labels'),

            isCoremeasure: sql<boolean>`
              EXISTS (
                SELECT 1
                FROM ${actionDefinitionTagTable}
                WHERE ${and(
                  eq(
                    actionDefinitionTagTable.actionId,
                    actionDefinitionTable.actionId
                  ),
                  eq(
                    actionDefinitionTagTable.referentielId,
                    actionDefinitionTable.referentielId
                  ),
                  eq(
                    actionDefinitionTagTable.tagRef,
                    ImportActionDefinitionCoremeasureType.COREMEASURE
                  )
                )}
              )
            `.as('isCoremeasure'),

            thematiques: sql<Array<ActionThematique>>`
              COALESCE(
                (
                  SELECT jsonb_agg(
                    DISTINCT jsonb_build_object(
                      'ref', ${referentielTagTable.ref},
                      'nom', ${referentielTagTable.nom}
                    )
                  )
                  FROM ${actionDefinitionTagTable}
                  JOIN ${referentielTagTable}
                    ON ${eq(
                      referentielTagTable.ref,
                      actionDefinitionTagTable.tagRef
                    )}
                  WHERE ${and(
                    eq(
                      actionDefinitionTagTable.actionId,
                      actionDefinitionTable.actionId
                    ),
                    eq(
                      actionDefinitionTagTable.referentielId,
                      actionDefinitionTable.referentielId
                    ),
                    eq(
                      referentielTagTable.type,
                      ReferentielTagTypeEnum.THEMATIQUE
                    )
                  )}
                ),
                '[]'::jsonb
              )
            `.as('thematiques'),
          })
          .from(actionDefinitionTable)
          .innerJoin(
            referentielDefinitionTable,
            and(
              eq(
                referentielDefinitionTable.id,
                actionDefinitionTable.referentielId
              ),
              eq(
                referentielDefinitionTable.version,
                actionDefinitionTable.referentielVersion
              )
            )
          )
          .where(eq(actionDefinitionTable.referentielId, referentielId))
          .orderBy(asc(actionDefinitionTable.actionId));

        return success({
          referentielVersion: referentiel.version,
          definitionsById: Object.fromEntries(
            definitions.map((definition) => [definition.actionId, definition])
          ),
        });
      },
      { isolationLevel: 'repeatable read', accessMode: 'read only' }
    );
  }
}
