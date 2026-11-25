import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  ActionType,
  ActionTypeEnum,
  MesureAuditStatutEnum,
} from '@tet/domain/referentiels';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { actionDefinitionTable } from '../../models/action-definition.table';
import { actionDepth } from '../../models/action-depth.column';
import { referentielDefinitionTable } from '../../models/referentiel-definition.table';
import {
  ListMesureAuditStatutsInput,
  ListMesureAuditStatutsOutput,
} from './handle-mesure-audit-statut.dto';
import { mesureAuditStatutTable } from './mesure-audit-statut.table';

@Injectable()
export class ListMesureAuditStatutsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async list({
    collectiviteId,
    referentielId,
    auditId,
  }: ListMesureAuditStatutsInput & {
    auditId: number;
  }): Promise<ListMesureAuditStatutsOutput> {
    const mesureType = sql<ActionType>`${referentielDefinitionTable.hierarchie}[${actionDepth} + 1]`;

    return this.databaseService.db
      .select({
        mesureId: actionDefinitionTable.actionId,
        mesureType,
        mesureNom: actionDefinitionTable.nom,
        statut: sql<MesureAuditStatutEnum>`COALESCE(${mesureAuditStatutTable.statut}, 'non_audite')`,
        avis: sql<string>`COALESCE(${mesureAuditStatutTable.avis}, '')`,
        ordreDuJour: sql<boolean>`COALESCE(${mesureAuditStatutTable.ordreDuJour}, false)`,
        auditId: sql`${auditId}`.mapWith(Number),
        collectiviteId: sql`${collectiviteId}`.mapWith(Number),
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
      .leftJoin(
        mesureAuditStatutTable,
        and(
          eq(mesureAuditStatutTable.auditId, auditId),
          eq(mesureAuditStatutTable.collectiviteId, collectiviteId),
          eq(mesureAuditStatutTable.mesureId, actionDefinitionTable.actionId)
        )
      )
      .where(
        and(
          eq(actionDefinitionTable.referentiel, referentielId),
          inArray(mesureType, [
            ActionTypeEnum.AXE,
            ActionTypeEnum.SOUS_AXE,
            ActionTypeEnum.ACTION,
          ])
        )
      )
      .orderBy(asc(actionDefinitionTable.actionId));
  }
}
