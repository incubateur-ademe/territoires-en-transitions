import { getReferentielIdFromActionId } from '@/backend/referentiels/referentiels.utils';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@/backend/users/index-domain';
import { DatabaseService } from '@/backend/utils';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { auditTable } from '../audit.table';
import {
  GetMesureAuditStatutRequest,
  GetMesureAuditStatutResponse,
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
    private readonly permissions: PermissionService
  ) {}

  async getStatut(
    { collectiviteId, mesureId }: GetMesureAuditStatutRequest,
    user: AuthenticatedUser
  ): Promise<GetMesureAuditStatutResponse> {
    await this.permissions.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.LECTURE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    const referentielId = getReferentielIdFromActionId(mesureId);

    const [auditEnCours] = await this.db
      .select()
      .from(auditTable)
      .where(
        and(
          eq(auditTable.collectiviteId, collectiviteId),
          eq(auditTable.referentielId, referentielId),
          eq(auditTable.clos, false)
        )
      )
      .orderBy(auditTable.dateDebut)
      .limit(1);

    if (!auditEnCours) {
      throw new Error(
        `Aucun audit en cours trouvé pour la collectivité ${collectiviteId} et le référentiel ${referentielId}`
      );
    }

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
    const [audit] = await this.db
      .select()
      .from(auditTable)
      .where(
        and(
          eq(auditTable.collectiviteId, input.collectiviteId),
          eq(auditTable.referentielId, referentielId),
          eq(auditTable.clos, false)
        )
      )
      .orderBy(auditTable.dateDebut)
      .limit(1);

    if (!audit) {
      throw new Error(
        `Aucun audit en cours trouvé pour la collectivité ${input.collectiviteId} et le référentiel ${referentielId}`
      );
    }

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
