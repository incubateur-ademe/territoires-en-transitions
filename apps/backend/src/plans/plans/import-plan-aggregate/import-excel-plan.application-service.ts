import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result } from '@tet/backend/utils/result.type';
import { PersonneId } from '@tet/domain/collectivites';
import { createImportPlanInput } from './factories/create-plan-import-input.factory';
import { ImportPlanService } from './import-plan.service';
import {
  ExcelParsingError,
  ImportErrors,
  TransformationError,
} from './import.errors';
import { parsePlanExcel } from './parsers/excel-parser';

@Injectable()
export class ImportExcelPlanApplicationService {
  constructor(private readonly importPlanService: ImportPlanService) {}

  async import(
    user: AuthenticatedUser,
    file: string,
    collectiviteId: number,
    planName: string,
    planType?: number,
    pilotes?: PersonneId[],
    referents?: PersonneId[],
    dateDebut?: string | null,
    dateFin?: string | null
  ): Promise<Result<{ planId: number; fichesCount: number }, ImportErrors>> {
    // 1. Parse Excel file
    const parsedRows = await parsePlanExcel(file);
    if (!parsedRows.success) {
      return failure(new ExcelParsingError(parsedRows.error.message));
    }

    // 2. Transform to domain objects
    const planResult = await createImportPlanInput(
      parsedRows.data,
      planName,
      planType,
      pilotes,
      referents,
      dateDebut,
      dateFin
    );
    if (!planResult.success) {
      return failure(new TransformationError(planResult.error));
    }

    // 3. Persist (validation + transaction)
    return this.importPlanService.save({
      planInput: planResult.data,
      collectiviteId,
      user,
    });
  }
}
