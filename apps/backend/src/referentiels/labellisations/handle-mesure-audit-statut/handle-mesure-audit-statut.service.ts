import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result, failure, success } from '@tet/backend/utils/result.type';
import {
  getReferentielIdFromActionId,
  MesureAuditStatutEnum,
} from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { GetAuditEnCoursRepository } from '../get-audit-en-cours/get-audit-en-cours.repository';
import {
  GetMesureAuditStatutInput,
  GetMesureAuditStatutOutput,
  ListMesureAuditStatutsInput,
  ListMesureAuditStatutsOutput,
  UpdateMesureAuditStatutInput,
  UpdateMesureAuditStatutOutput,
} from './handle-mesure-audit-statut.dto';
import { HandleMesureAuditStatutError } from './handle-mesure-audit-statut.errors';
import { ListMesureAuditStatutsRepository } from './list-mesure-audit-statuts.repository';
import { mesureAuditStatutTable } from './mesure-audit-statut.table';

@Injectable()
export class HandleMesureAuditStatutService {
  db = this.databaseService.db;
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissions: PermissionService,
    private readonly listMesureAuditStatutsRepository: ListMesureAuditStatutsRepository,
    private readonly getAuditEnCoursRepository: GetAuditEnCoursRepository
  ) {}

  async listStatuts(
    { collectiviteId, referentielId }: ListMesureAuditStatutsInput,
    user: AuthenticatedUser
  ): Promise<ListMesureAuditStatutsOutput> {
    await this.permissions.assertAllowed(
      user,
      'referentiels.read',
      ResourceType.REFERENTIEL,
      { collectiviteId, referentielId }
    );

    const auditEnCours = await this.getAuditEnCoursRepository.execute({
      collectiviteId,
      referentielId,
    });

    return this.listMesureAuditStatutsRepository.list({
      collectiviteId,
      referentielId,
      auditId: auditEnCours.id,
    });
  }

  async getStatut(
    { collectiviteId, mesureId }: GetMesureAuditStatutInput,
    user: AuthenticatedUser
  ): Promise<GetMesureAuditStatutOutput> {
    const referentielId = getReferentielIdFromActionId(mesureId);

    await this.permissions.assertAllowed(
      user,
      'referentiels.read_confidentiel',
      ResourceType.REFERENTIEL,
      { collectiviteId, referentielId }
    );

    const auditEnCours = await this.getAuditEnCoursRepository.execute({
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
    input: UpdateMesureAuditStatutInput,
    user: AuthenticatedUser
  ): Promise<
    Result<UpdateMesureAuditStatutOutput, HandleMesureAuditStatutError>
  > {
    const referentielId = getReferentielIdFromActionId(input.mesureId);

    const auditEnCours = await this.getAuditEnCoursRepository.execute({
      collectiviteId: input.collectiviteId,
      referentielId,
    });

    const auditId = auditEnCours.id;

    // AUDIT: rôle auditeur + mode référentiel (via audit → collectivite/referentiel).
    const auditPermissionResult = await this.permissions.isAllowed(
      user,
      'referentiels.labellisations.mutate_action_audit_statut',
      ResourceType.AUDIT,
      { auditId }
    );
    if (!auditPermissionResult.success) {
      return failure(auditPermissionResult.error);
    }

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

    return success(statut);
  }
}
