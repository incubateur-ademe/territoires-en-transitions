import { Injectable, Logger } from '@nestjs/common';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import { auditeurTable } from '@tet/backend/referentiels/labellisations/auditeur.table';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result } from '@tet/backend/utils/result.type';
import { canUpdateAuditReport } from '@tet/domain/referentiels';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq } from 'drizzle-orm';
import { auditTable } from '../audit.table';
import {
  UpdateAuditReportError,
  UpdateAuditReportErrorEnum,
} from './update-audit-report.errors';
import { UpdateAuditReportInput } from './update-audit-report.input';

@Injectable()
export class UpdateAuditReportService {
  private readonly logger = new Logger(UpdateAuditReportService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async updateAuditReport(
    { preuveId, fichierId }: UpdateAuditReportInput,
    user: AuthenticatedUser
  ): Promise<Result<{ preuveId: number }, UpdateAuditReportError>> {
    try {
      const [context] = await this.databaseService.db
        .select({
          collectiviteId: preuveAuditTable.collectiviteId,
          clos: auditTable.clos,
          valide: auditTable.valide,
          dateFin: auditTable.dateFin,
          auditeur: auditeurTable.auditeur,
        })
        .from(preuveAuditTable)
        .innerJoin(auditTable, eq(auditTable.id, preuveAuditTable.auditId))
        .leftJoin(
          auditeurTable,
          and(
            eq(auditeurTable.auditId, preuveAuditTable.auditId),
            eq(auditeurTable.auditeur, user.id)
          )
        )
        .where(eq(preuveAuditTable.id, preuveId));

      if (!context) {
        return {
          success: false,
          error: UpdateAuditReportErrorEnum.PREUVE_NOT_FOUND,
        };
      }

      const allowed = canUpdateAuditReport({
        isAuditeur: context.auditeur !== null,
        audit: {
          clos: context.clos,
          valide: context.valide,
          dateFin: context.dateFin,
        },
        now: new Date(),
      });

      if (!allowed) {
        return {
          success: false,
          error: UpdateAuditReportErrorEnum.UPDATE_NOT_ALLOWED,
        };
      }

      const [fichier] = await this.databaseService.db
        .select({ id: bibliothequeFichierTable.id })
        .from(bibliothequeFichierTable)
        .where(
          and(
            eq(bibliothequeFichierTable.id, fichierId),
            eq(bibliothequeFichierTable.collectiviteId, context.collectiviteId)
          )
        );

      if (!fichier) {
        return {
          success: false,
          error: UpdateAuditReportErrorEnum.FICHIER_NOT_FOUND,
        };
      }

      await this.databaseService.db
        .update(preuveAuditTable)
        .set({ fichierId })
        .where(eq(preuveAuditTable.id, preuveId));

      return { success: true, data: { preuveId } };
    } catch (error) {
      this.logger.error(
        `Erreur lors du remplacement du rapport d'audit (preuve ${preuveId}): ${getErrorMessage(
          error
        )}`
      );
      return {
        success: false,
        error: UpdateAuditReportErrorEnum.DATABASE_ERROR,
      };
    }
  }
}
