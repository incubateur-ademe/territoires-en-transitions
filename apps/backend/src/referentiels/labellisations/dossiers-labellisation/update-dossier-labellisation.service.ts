import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { utilisateurSupportTable } from '@tet/backend/users/authorizations/roles/utilisateur-support.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { and, eq, sql } from 'drizzle-orm';
import { auditTable } from '../audit.table';
import { auditeurTable } from '../auditeur.table';
import { labellisationDemandeTable } from '../labellisation-demande.table';
import { checkLabellisationsAdmin } from './check-labellisations-admin.utils';
import {
  DossiersLabellisationError,
  DossiersLabellisationErrorEnum,
} from './dossiers-labellisation.errors';
import {
  AddAuditeurInput,
  RemoveAuditeurInput,
  UpdateDemandeLabellisationInput,
} from './dossiers-labellisation.input';

@Injectable()
export class UpdateDossierLabellisationService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  private readonly db = this.databaseService.db;

  async updateDemande(
    { auditId, sujet, etoiles }: UpdateDemandeLabellisationInput,
    { user }: ServiceSecondArg
  ): Promise<Result<void, DossiersLabellisationError>> {
    const auditResult = await this.getOpenAudit(auditId, user);
    if (!auditResult.success) {
      return auditResult;
    }
    const { demandeId } = auditResult.data;
    if (!demandeId) {
      return failure(DossiersLabellisationErrorEnum.DOSSIER_NOT_FOUND);
    }

    // Mêmes règles que l'ancienne fonction Retool `retool_patch_demande`
    if (sujet === 'cot' && etoiles !== null) {
      return failure(
        DossiersLabellisationErrorEnum.ETOILES_NOT_ALLOWED_FOR_COT
      );
    }
    if (sujet !== 'cot' && etoiles === null) {
      return failure(DossiersLabellisationErrorEnum.ETOILES_REQUIRED);
    }

    await this.db
      .update(labellisationDemandeTable)
      .set({ sujet, etoiles })
      .where(eq(labellisationDemandeTable.id, demandeId));

    return success(undefined);
  }

  async addAuditeur(
    input: AddAuditeurInput,
    { user }: ServiceSecondArg
  ): Promise<
    Result<
      { userId: string; prenom: string; nom: string; email: string },
      DossiersLabellisationError
    >
  > {
    const { auditId } = input;
    const auditResult = await this.getOpenAudit(auditId, user);
    if (!auditResult.success) {
      return auditResult;
    }

    const byEmail = 'email' in input;
    const [auditeur] = await this.db
      .select({
        userId: dcpTable.id,
        prenom: dcpTable.prenom,
        nom: dcpTable.nom,
        email: dcpTable.email,
        hasRoleTeteAuditeur: utilisateurSupportTable.hasRoleTeteAuditeur,
      })
      .from(dcpTable)
      .leftJoin(
        utilisateurSupportTable,
        eq(utilisateurSupportTable.userId, dcpTable.id)
      )
      .where(
        and(
          byEmail
            ? eq(sql`lower(${dcpTable.email})`, input.email)
            : eq(dcpTable.id, input.userId),
          eq(dcpTable.deleted, false)
        )
      )
      .limit(1);

    if (!auditeur) {
      return failure(
        byEmail
          ? DossiersLabellisationErrorEnum.AUDITEUR_EMAIL_NOT_FOUND
          : DossiersLabellisationErrorEnum.NOT_AUDITEUR
      );
    }
    // Choisir dans la liste exige le rôle ; saisir l'email l'attribue
    if (!auditeur.hasRoleTeteAuditeur && !byEmail) {
      return failure(DossiersLabellisationErrorEnum.NOT_AUDITEUR);
    }

    const { hasRoleTeteAuditeur, ...result } = auditeur;
    await this.db.transaction(async (tx) => {
      if (!hasRoleTeteAuditeur) {
        await tx
          .insert(utilisateurSupportTable)
          .values({ userId: result.userId, hasRoleTeteAuditeur: true })
          .onConflictDoUpdate({
            target: utilisateurSupportTable.userId,
            set: { hasRoleTeteAuditeur: true },
          });
      }
      await tx
        .insert(auditeurTable)
        .values({ auditId, auditeur: result.userId })
        .onConflictDoNothing();
    });

    return success(result);
  }

  async removeAuditeur(
    { auditId, userId }: RemoveAuditeurInput,
    { user }: ServiceSecondArg
  ): Promise<Result<void, DossiersLabellisationError>> {
    const auditResult = await this.getOpenAudit(auditId, user);
    if (!auditResult.success) {
      return auditResult;
    }

    await this.db
      .delete(auditeurTable)
      .where(
        and(
          eq(auditeurTable.auditId, auditId),
          eq(auditeurTable.auditeur, userId)
        )
      );

    return success(undefined);
  }

  private async getOpenAudit(
    auditId: number,
    user: ServiceSecondArg['user']
  ): Promise<Result<{ demandeId: number | null }, DossiersLabellisationError>> {
    const isAllowed = await checkLabellisationsAdmin(
      this.permissionService,
      user
    );
    if (!isAllowed.success) {
      return isAllowed;
    }

    const [audit] = await this.db
      .select({ demandeId: auditTable.demandeId, clos: auditTable.clos })
      .from(auditTable)
      .where(eq(auditTable.id, auditId));
    if (!audit) {
      return failure(DossiersLabellisationErrorEnum.DOSSIER_NOT_FOUND);
    }
    if (audit.clos) {
      return failure(DossiersLabellisationErrorEnum.DOSSIER_CLOS);
    }
    return success({ demandeId: audit.demandeId });
  }
}
