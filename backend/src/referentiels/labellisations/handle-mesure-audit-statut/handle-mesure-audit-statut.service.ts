import { ListActionsService } from '@/backend/referentiels/list-actions/list-actions.service';
import { getReferentielIdFromActionId } from '@/backend/referentiels/referentiels.utils';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@/backend/users/index-domain';
import { DatabaseService } from '@/backend/utils';
import { Injectable } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { ActionTypeEnum } from '../../models/action-type.enum';
import { GetAuditEnCoursRepository } from '../get-audit-en-cours/get-audit-en-cours.repository';
import {
  GetMesureAuditStatutRequest,
  ListMesureAuditStatutsRequest,
  MesureAuditStatut,
  UpdateMesureAuditStatutRequest,
  UpdateMesureAuditStatutResponse,
} from './handle-mesure-audit-statut.dto';
import {
  MesureAuditStatutEnum,
  mesureAuditStatutTable,
} from './mesure-audit-statut.table';

@Injectable()
export class HandleMesureAuditStatutService {
  db = this.databaseService.db;
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissions: PermissionService,
    private readonly listActionsService: ListActionsService,
    private readonly getAuditEnCoursService: GetAuditEnCoursRepository
  ) {}

  async listStatuts(
    { collectiviteId, referentielId }: ListMesureAuditStatutsRequest,
    user: AuthenticatedUser
  ): Promise<MesureAuditStatut[]> {
    await this.permissions.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.LECTURE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    const auditEnCours = await this.getAuditEnCoursService.execute({
      collectiviteId,
      referentielId,
    });

    const mesuresWithLevel = this.db
      .$with('mesures_with_level')
      .as(this.listActionsService.listWithDepthAndActionType());

    const mesures = await this.db
      .with(mesuresWithLevel)
      .select({
        mesureId: mesuresWithLevel.actionId,
        statut: sql<MesureAuditStatutEnum>`COALESCE(${mesureAuditStatutTable.statut}, 'non_audite')`,
        avis: sql<string>`COALESCE(${mesureAuditStatutTable.avis}, '')`,
        ordreDuJour: sql<boolean>`COALESCE(${mesureAuditStatutTable.ordreDuJour}, false)`,
        auditId: sql`${auditEnCours.id}`.mapWith(Number),
        collectiviteId: sql`${collectiviteId}`.mapWith(Number),
      })
      .from(mesuresWithLevel)
      .leftJoin(
        mesureAuditStatutTable,
        and(
          eq(mesureAuditStatutTable.auditId, auditEnCours.id),
          eq(mesureAuditStatutTable.collectiviteId, collectiviteId),
          eq(mesureAuditStatutTable.mesureId, mesuresWithLevel.actionId)
        )
      )
      .where(
        and(
          eq(mesuresWithLevel.referentiel, referentielId),
          inArray(mesuresWithLevel.actionType, [
            ActionTypeEnum.AXE,
            ActionTypeEnum.SOUS_AXE,
            ActionTypeEnum.ACTION,
          ])
        )
      );

    return mesures;
  }

  async getStatut(
    { collectiviteId, mesureId }: GetMesureAuditStatutRequest,
    user: AuthenticatedUser
  ): Promise<MesureAuditStatut> {
    await this.permissions.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.LECTURE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    const referentielId = getReferentielIdFromActionId(mesureId);

    const auditEnCours = await this.getAuditEnCoursService.execute({
      collectiviteId,
      referentielId,
    });

    const [statut] = await this.db
      .select()
      .from(mesureAuditStatutTable)
      .where(
        and(
          eq(mesureAuditStatutTable.collectiviteId, collectiviteId),
          eq(mesureAuditStatutTable.mesureId, mesureId),
          eq(mesureAuditStatutTable.auditId, auditEnCours.id)
        )
      )
      .limit(1);

    if (!statut) {
      return {
        collectiviteId,
        auditId: auditEnCours.id,
        mesureId,
        statut: MesureAuditStatutEnum.NON_AUDITE,
        avis: '',
        ordreDuJour: false,
      };
    }
    return statut;
  }

  async updateStatut(
    input: UpdateMesureAuditStatutRequest,
    user: AuthenticatedUser
  ): Promise<UpdateMesureAuditStatutResponse> {
    const referentielId = getReferentielIdFromActionId(input.mesureId);
    const audit = await this.getAuditEnCoursService.execute({
      collectiviteId: input.collectiviteId,
      referentielId,
    });

    const auditId = audit.id;

    // Vérification des droits : auditeur sur l'audit courant
    await this.permissions.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.AUDIT'],
      ResourceType.AUDIT,
      auditId
    );

    // Upsert (insert or update) dans action_audit_state
    const [statut] = await this.db
      .insert(mesureAuditStatutTable)
      .values({
        auditId,
        collectiviteId: input.collectiviteId,
        mesureId: input.mesureId,
        statut: input.statut ?? MesureAuditStatutEnum.NON_AUDITE,
        avis: input.avis,
        ordreDuJour: input.ordreDuJour,
        modifiedBy: user.id,
      })
      .onConflictDoUpdate({
        target: [
          mesureAuditStatutTable.auditId,
          mesureAuditStatutTable.mesureId,
        ],
        set: {
          ...(input.statut !== undefined && { statut: input.statut }),
          ...(input.avis !== undefined && { avis: input.avis }),
          ...(input.ordreDuJour !== undefined && {
            ordreDuJour: input.ordreDuJour,
          }),
        },
      })
      .returning();

    return statut;
  }
}
