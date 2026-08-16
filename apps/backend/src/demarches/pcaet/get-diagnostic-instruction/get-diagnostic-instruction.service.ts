import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { type DemarchePcaetDiagnostic } from '@tet/domain/demarches';
import { eq } from 'drizzle-orm';
import { DemarchePcaetDiagnosticRepository } from '../shared/demarche-pcaet-diagnostic.repository';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';
import {
  GetDiagnosticInstructionError,
  GetDiagnosticInstructionErrorEnum,
} from './get-diagnostic-instruction.errors';
import { GetDiagnosticInstructionInput } from './get-diagnostic-instruction.input';

@Injectable()
export class GetDiagnosticInstructionService {
  private readonly logger = new Logger(GetDiagnosticInstructionService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly diagnosticRepository: DemarchePcaetDiagnosticRepository
  ) {}

  async getDiagnosticInstruction(
    { demandeAvisId }: GetDiagnosticInstructionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaetDiagnostic, GetDiagnosticInstructionError>> {
    const permissionResult =
      await this.depotPermissionsService.canConsulterDepot(demandeAvisId, {
        user,
        tx,
      });
    if (!permissionResult.success) {
      return failure(GetDiagnosticInstructionErrorEnum.UNAUTHORIZED);
    }

    const rows = await (tx ?? this.databaseService.db)
      .select({ demarcheId: pcaetDemandeAvisTable.demarcheId })
      .from(pcaetDemandeAvisTable)
      .where(eq(pcaetDemandeAvisTable.id, demandeAvisId))
      .limit(1);

    const demande = rows[0];
    if (!demande) {
      return failure(GetDiagnosticInstructionErrorEnum.DEMANDE_AVIS_NOT_FOUND);
    }

    const snapshot = await this.diagnosticRepository.findLatestSnapshot(
      { demarcheId: demande.demarcheId, jalon: 'transmission' },
      tx
    );
    if (!snapshot) {
      this.logger.warn(
        `Aucune photo de diagnostic pour la démarche ${demande.demarcheId} (demande d'avis ${demandeAvisId})`
      );
      return failure(GetDiagnosticInstructionErrorEnum.DIAGNOSTIC_NON_FIGE);
    }

    return success({ ...snapshot.payload, snapshotDate: snapshot.date });
  }
}
