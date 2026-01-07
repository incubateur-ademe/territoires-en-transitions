import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result } from '@tet/backend/utils/result.type';
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
  'status' | 'errorMessage' | 'fileId'
>;

@Injectable()
export class ReportGenerationRepository {
  private readonly logger = new Logger(ReportGenerationRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    input: GenerateReportInput,
    name: string,
    user: AuthenticatedUser,
    status: ReportGenerationStatus = 'pending'
  ): Promise<
    Result<
      ReportGeneration,
      typeof GenerateReportErrorEnum.CREATE_REPORT_GENERATION_ERROR
    >
  > {
    try {
      const [result] = await this.databaseService.db
        .insert(reportGenerationTable)
        .values({
          planId: input.planId,
          name,
          templateRef: input.templateKey,
          createdBy: user.id,
          status: status,
          options: {
            ficheIds: input.ficheIds,
            logoFile: input.logoFile,
            includeFicheIndicateursSlides: input.includeFicheIndicateursSlides,
          },
        })
        .returning();

      return {
        success: true,
        data: result,
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
    Result<
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

  async get(
    id: string
  ): Promise<
    Result<
      ReportGeneration,
      typeof GenerateReportErrorEnum.GET_REPORT_GENERATION_ERROR
    >
  > {
    try {
      const result = await this.databaseService.db
        .select()
        .from(reportGenerationTable)
        .where(eq(reportGenerationTable.id, id));
      if (!result.length) {
        return {
          success: false,
          error: GenerateReportErrorEnum.GET_REPORT_GENERATION_ERROR,
        };
      }
      return {
        success: true,
        data: result[0],
      };
    } catch (error) {
      this.logger.error(
        `Error getting report generation ${id}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        success: false,
        error: GenerateReportErrorEnum.GET_REPORT_GENERATION_ERROR,
      };
    }
  }
}
