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
  applyActionTextOverrides,
  ListActionDefinitionsOutput,
  ReferentielLabel,
  ReferentielLabelEnum,
  ReferentielTagTypeEnum,
} from '@tet/domain/referentiels';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { RenderActionTextsService } from '../action-definitions/render-action-texts.service';
import { ImportActionDefinitionCoremeasureType } from '../import-referentiel/import-action-definition.dto';
import { actionDefinitionColumns } from '../models/action-definition-columns.column';
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
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly renderActionTextsService: RenderActionTextsService
  ) {}

  private db = this.databaseService.db;

  /**
   * Sans `collectiviteId` : textes par défaut, identiques pour toutes les
   * collectivités (procédure tRPC publique). Avec : textes rendus pour le
   * profil de la collectivité, pour les appelants du backend qui la
   * connaissent (export, etc.). L'input tRPC ne contient pas cette option.
   */
  async listActionDefinitions({
    referentielId,
    collectiviteId,
  }: ListActionDefinitionsInput & { collectiviteId?: number }): Promise<
    Result<ListActionDefinitionsOutput, CommonError>
  > {
    const result = await this.listDefaultActionDefinitions(referentielId);
    if (!result.success || collectiviteId === undefined) {
      return result;
    }
    const textOverrides = await this.renderActionTextsService.getTextOverrides(
      collectiviteId,
      { referentielId }
    );
    if (textOverrides.size === 0) {
      return result;
    }
    return success({
      ...result.data,
      definitionsById: Object.fromEntries(
        Object.entries(result.data.definitionsById).map(
          ([actionId, definition]) => [
            actionId,
            applyActionTextOverrides(definition, textOverrides.get(actionId)),
          ]
        )
      ),
    });
  }

  private async listDefaultActionDefinitions(
    referentielId: ListActionDefinitionsInput['referentielId']
  ): Promise<Result<ListActionDefinitionsOutput, CommonError>> {
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
            ...actionDefinitionColumns,
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
