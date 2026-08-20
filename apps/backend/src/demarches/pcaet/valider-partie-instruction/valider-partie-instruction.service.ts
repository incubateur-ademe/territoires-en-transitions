import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { and, eq } from 'drizzle-orm';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { pcaetInstructionValidationTable } from '../shared/models/pcaet-instruction-validation.table';
import { ValiderPartieInstructionError } from './valider-partie-instruction.errors';
import { ValiderPartieInstructionInput } from './valider-partie-instruction.input';
import { PartieValidee } from './valider-partie-instruction.output';

@Injectable()
export class ValiderPartieInstructionService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly depotPermissionsService: DepotPermissionsService
  ) {}

  async validerPartieInstruction(
    { demandeAvisId, partie, validee }: ValiderPartieInstructionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PartieValidee[], ValiderPartieInstructionError>> {
    const permissionResult = await this.depotPermissionsService.canDeposerAvis(
      demandeAvisId,
      {
        user,
        tx,
      }
    );
    if (!permissionResult.success) {
      return failure(permissionResult.error);
    }

    const db = tx ?? this.databaseService.db;

    if (validee) {
      await db
        .insert(pcaetInstructionValidationTable)
        .values({ demandeAvisId, partie, validePar: user.id })
        .onConflictDoNothing();
    } else {
      await db
        .delete(pcaetInstructionValidationTable)
        .where(
          and(
            eq(pcaetInstructionValidationTable.demandeAvisId, demandeAvisId),
            eq(pcaetInstructionValidationTable.partie, partie)
          )
        );
    }

    const rows = await db
      .select({
        partie: pcaetInstructionValidationTable.partie,
        valideLe: pcaetInstructionValidationTable.valideLe,
        validePar: pcaetInstructionValidationTable.validePar,
      })
      .from(pcaetInstructionValidationTable)
      .where(eq(pcaetInstructionValidationTable.demandeAvisId, demandeAvisId));

    return success(rows);
  }
}
