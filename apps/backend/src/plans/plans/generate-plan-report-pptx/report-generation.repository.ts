import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { MethodResult } from '@tet/backend/utils/result.type';
import {
  GenerateReportInput,
  ReportGeneration,
  ReportGenerationStatus,
} from '@tet/domain/plans';
import { eq } from 'drizzle-orm';
import { GenerateReportErrorEnum } from './generate-reports.errors';
import { reportGenerationTable } from './report-generation.entity';

export type UpdateReportGenerationInput = Pick<
  ReportGeneration,
  'status' | 'errorMessage'
>;

@Injectable()
export class ReportGenerationRepository {
  private readonly logger = new Logger(ReportGenerationRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    input: GenerateReportInput,
    status: ReportGenerationStatus = 'pending'
  ): Promise<
    MethodResult<
      { id: string },
      typeof GenerateReportErrorEnum.CREATE_REPORT_GENERATION_ERROR
    >
  > {
    try {
      const [result] = await this.databaseService.db
        .insert(reportGenerationTable)
        .values({
          planId: input.planId,
          templateRef: input.templateKey,
          status: status,
          options: {
            ficheIds: input.ficheIds,
            logoFile: input.logoFile,
            includeFicheIndicateursSlides: input.includeFicheIndicateursSlides,
          },
        })
        .returning({ id: reportGenerationTable.id });

      return {
        success: true,
        data: { id: result.id },
      };
    } catch (error) {
      this.logger.error(
        `Error creating report generation: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        success: false,
        error: GenerateReportErrorEnum.CREATE_REPORT_GENERATION_ERROR,
      };
    }
  }

  async update(
    id: string,
    input: UpdateReportGenerationInput
  ): Promise<
    MethodResult<
      undefined,
      typeof GenerateReportErrorEnum.UPDATE_REPORT_GENERATION_ERROR
    >
  > {
    try {
      await this.databaseService.db
        .update(reportGenerationTable)
        .set({
          ...input,
          modifiedAt: new Date().toISOString(),
        })
        .where(eq(reportGenerationTable.id, id));

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      this.logger.error(
        `Error updating report generation ${id}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        success: false,
        error: GenerateReportErrorEnum.UPDATE_REPORT_GENERATION_ERROR,
      };
    }
  }
}
