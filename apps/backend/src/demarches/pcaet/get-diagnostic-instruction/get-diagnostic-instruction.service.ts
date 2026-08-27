import { Injectable } from '@nestjs/common';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { type DemarchePcaetDiagnostic } from '@tet/domain/demarches';
import { eq } from 'drizzle-orm';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';
import {
  GetDiagnosticInstructionError,
  GetDiagnosticInstructionErrorEnum,
} from './get-diagnostic-instruction.errors';
import { GetDiagnosticInstructionInput } from './get-diagnostic-instruction.input';

@Injectable()
export class GetDiagnosticInstructionService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly diagnosticService: DemarchePcaetDiagnosticService
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
      .select({
        demarcheId: pcaetDemandeAvisTable.demarcheId,
        collectiviteId: demarcheTable.collectiviteId,
      })
      .from(pcaetDemandeAvisTable)
      .innerJoin(
        demarcheTable,
        eq(demarcheTable.id, pcaetDemandeAvisTable.demarcheId)
      )
      .where(eq(pcaetDemandeAvisTable.id, demandeAvisId))
      .limit(1);

    const demande = rows[0];
    if (!demande) {
      return failure(GetDiagnosticInstructionErrorEnum.DEMANDE_AVIS_NOT_FOUND);
    }

    return success(
      await this.diagnosticService.loadPayload(
        {
          demarcheId: demande.demarcheId,
          collectiviteId: demande.collectiviteId,
        },
        tx
      )
    );
  }
}
