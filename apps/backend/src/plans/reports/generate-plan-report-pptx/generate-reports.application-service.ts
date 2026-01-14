import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { CreateDocumentService } from '@tet/backend/collectivites/documents/create-document/create-document.service';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { NotifiedOnEnum } from '@tet/backend/utils/notifications/models/notified-on.enum';
import { Result } from '@tet/backend/utils/result.type';
import { CollectiviteAvecType } from '@tet/domain/collectivites';
import {
  GenerateReportInput,
  Plan,
  ReportGeneration,
  ReportTemplatesType,
} from '@tet/domain/plans';
import { PermissionOperationEnum } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { Queue } from 'bullmq';
import { mkdirSync, rmSync } from 'fs';
import * as path from 'path';
import slugify from 'slugify';
import { GetPlanService } from '../../plans/get-plan/get-plan.service';
import {
  GenerateReportError,
  GenerateReportErrorEnum,
} from './generate-reports.errors';
import { NotifyReportService } from './notify-report.service';
import { PptBuilderService } from './ppt-builder.service';
import { ReportGenerationRepository } from './report-generation.repository';
import { ReportTemplateConfig } from './report-template-config.dto';

export const PLAN_REPORT_GENERATION_QUEUE_NAME = 'plan_report_generation';
@Injectable()
export class GenerateReportsApplicationService {
  private readonly logger = new Logger(GenerateReportsApplicationService.name);

  private readonly SLIDE_TEMPLATES_CONFIG: {
    [key in ReportTemplatesType]: ReportTemplateConfig;
  } = {
    general_bilan_template: {
      key: 'general_bilan_template',
      templatePath: 'template_bilan.pptx',
      title: 'Template de présentation de bilans annuels',
      default: true,
      slides: {
        title_slide: 1,
        table_of_contents_slide: 2,
        overview_section_slide: 3,
        summary_slide: 4,
        progression_slide: 5,
        donnees_territoriales_section_slide: 6,
        emissions_ges_slide: 7,
        consommations_finales_slide: 8,
        production_renouvelable_slide: 9,
        axes_section_slide: 10,
        axe_summary_slide: 11,
        fiche_summary_slide: 12,
        fiche_indicateurs_slide: 13,
        ressources_slide: 14,
      },
      max_fiche_indicateurs_per_slide: 1,
    },
  };

  constructor(
    private readonly planService: GetPlanService,
    private readonly collectiviteService: CollectivitesService,
    private readonly permissionService: PermissionService,
    private readonly reportGenerationRepository: ReportGenerationRepository,
    private readonly createDocumentService: CreateDocumentService,
    private readonly notifyReportService: NotifyReportService,
    private readonly pptBuilderService: PptBuilderService,
    @InjectQueue(PLAN_REPORT_GENERATION_QUEUE_NAME)
    private readonly planReportGenerationQueue: Queue
  ) {}

  private getReportName(
    collectivite: CollectiviteAvecType,
    plan: Plan
  ): string {
    return `${slugify(`Rapport_${collectivite.nom}_${plan.nom}`, {
      replacement: ' ',
      remove: /[*+~.()'"!:@]/g,
    })}.pptx`;
  }

  private async createGenerationDirectories(generationId: string) {
    const mediaDir = path.join(__dirname, `media/${generationId}`);
    const outputDir = path.join(__dirname, `output/${generationId}`);
    mkdirSync(mediaDir, { recursive: true });
    mkdirSync(outputDir, { recursive: true });
    return { mediaDir, outputDir };
  }

  private async cleanGenerationFiles(mediaDir: string, outputDir: string) {
    this.logger.log(
      `Cleaning generation files in ${mediaDir} and ${outputDir}`
    );

    if (mediaDir) {
      rmSync(mediaDir, { recursive: true });
    }
    if (outputDir) {
      rmSync(outputDir, { recursive: true });
    }
  }

  private async handleReportGenerationError(
    reportInfo: {
      collectiviteId: number;
      generationId: string;
      planId: number;
      userId: string;
      reportName: string;
    },
    mediaDir: string,
    outputDir: string,
    error: GenerateReportError
  ): Promise<{ success: false; error: GenerateReportError }> {
    const { generationId, collectiviteId, planId, userId, reportName } =
      reportInfo;

    await this.reportGenerationRepository.update(generationId, {
      status: 'failed',
      errorMessage: error,
      fileId: null,
    });

    await this.notifyReportService.createReportNotification(
      NotifiedOnEnum['PLANS.REPORTS.GENERATE_PLAN_REPORT_FAILED'],
      {
        collectiviteId: collectiviteId,
        planId: planId,
        createdBy: userId,
        reportId: generationId,
        reportName: reportName,
      }
    );

    await this.cleanGenerationFiles(mediaDir, outputDir);

    return {
      success: false,
      error: error,
    };
  }

  async get(
    reportId: string,
    user: AuthenticatedUser
  ): Promise<Result<ReportGeneration, GenerateReportError>> {
    const reportGenerationResult = await this.reportGenerationRepository.get(
      reportId
    );
    if (!reportGenerationResult.success) {
      return reportGenerationResult;
    }

    const plan = await this.planService.getPlan(
      { planId: reportGenerationResult.data.planId },
      user
    );
    if (!plan.success) {
      return {
        success: false,
        error: 'PLAN_NOT_FOUND',
      };
    }

    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.READ'],
      ResourceType.COLLECTIVITE,
      plan.data.collectiviteId,
      true
    );
    if (!isAllowed) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
      };
    }

    return {
      success: true,
      data: reportGenerationResult.data,
    };
  }

  async createPendingPlanReportGeneration(
    request: GenerateReportInput,
    user: AuthenticatedUser
  ): Promise<Result<ReportGeneration, GenerateReportError>> {
    this.logger.log(
      `Creating pending plan report generation for plan ${request.planId} with template ${request.templateKey}`
    );

    // Get plan to check permissions
    const plan = await this.planService.getPlan(
      { planId: request.planId },
      user
    );
    if (!plan.success) {
      return {
        success: false,
        error: 'PLAN_NOT_FOUND',
      };
    }

    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.READ'],
      ResourceType.COLLECTIVITE,
      plan.data.collectiviteId,
      true
    );
    if (!isAllowed) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
      };
    }

    const collectivite = await this.collectiviteService.getCollectiviteAvecType(
      plan.data.collectiviteId
    );

    const reportName = this.getReportName(collectivite, plan.data);

    // Create report generation entity with pending status
    const createResult = await this.reportGenerationRepository.create(
      request,
      collectivite.id,
      reportName,
      user,
      'pending'
    );

    if (!createResult.success) {
      this.logger.error(
        `Failed to create report generation entity: ${createResult.error}`
      );
      return createResult;
    }

    const generationId = createResult.data.id;
    this.logger.log(
      `Created report generation entity with id: ${generationId}, pushing to queue`
    );

    // Push to queue
    await this.planReportGenerationQueue.add(
      'generate-plan-report',
      {
        generationId,
        request,
        userId: user.id,
      },
      {
        jobId: generationId,
      }
    );

    return {
      success: true,
      data: createResult.data,
    };
  }

  async generatePlanReport(
    generationId: string,
    request: GenerateReportInput,
    userId: string
  ): Promise<Result<{ reportId: string }, GenerateReportError>> {
    let mediaDir = '';
    let outputDir = '';
    this.logger.log(
      `Generating plan report for generation ${generationId}, plan ${request.planId} with template ${request.templateKey}`
    );

    const reportGeneration = await this.reportGenerationRepository.get(
      generationId
    );
    if (!reportGeneration.success) {
      return reportGeneration;
    }
    const collectiviteId = reportGeneration.data.collectiviteId;
    const reportName = reportGeneration.data.name;

    // Update status to processing
    await this.reportGenerationRepository.update(generationId, {
      status: 'processing',
      errorMessage: null,
      fileId: null,
    });

    const templateConfig = this.SLIDE_TEMPLATES_CONFIG[request.templateKey];

    try {
      const directories = await this.createGenerationDirectories(generationId);
      mediaDir = directories.mediaDir;
      outputDir = directories.outputDir;

      const buildPresentationResult =
        await this.pptBuilderService.buildPresentation({
          mediaDir,
          outputDir,
          reportName,
          templateConfig,
          request,
        });
      if (!buildPresentationResult.success) {
        return this.handleReportGenerationError(
          {
            generationId,
            collectiviteId: collectiviteId,
            planId: request.planId,
            userId: userId,
            reportName: reportName,
          },
          mediaDir,
          outputDir,
          buildPresentationResult.error
        );
      }

      const uploadResult = await this.createDocumentService.uploadLocalFile(
        {
          collectiviteId: collectiviteId,
          hash: generationId,
          filename: reportName,
          confidentiel: false,
        },
        buildPresentationResult.data.reportPath
      );
      if (!uploadResult.success) {
        return this.handleReportGenerationError(
          {
            generationId,
            collectiviteId: collectiviteId,
            planId: request.planId,
            userId: userId,
            reportName: reportName,
          },
          mediaDir,
          outputDir,
          GenerateReportErrorEnum.UPLOAD_STORAGE_ERROR
        );
      }

      // Update status to completed at the end
      await this.reportGenerationRepository.update(generationId, {
        status: 'completed',
        errorMessage: null,
        fileId: uploadResult.data.id,
      });
      this.logger.log(
        `Updated report generation ${generationId} status to completed`
      );

      const createdNotification =
        await this.notifyReportService.createReportNotification(
          NotifiedOnEnum['PLANS.REPORTS.GENERATE_PLAN_REPORT_COMPLETED'],
          {
            collectiviteId: collectiviteId,
            planId: request.planId,
            createdBy: userId,
            reportId: generationId,
            reportName: reportName,
          }
        );

      if (!createdNotification.success) {
        return this.handleReportGenerationError(
          {
            generationId,
            collectiviteId: collectiviteId,
            planId: request.planId,
            userId: userId,
            reportName: reportName,
          },
          mediaDir,
          outputDir,
          GenerateReportErrorEnum.CREATE_NOTIFICATION_ERROR
        );
      }

      await this.cleanGenerationFiles(mediaDir, outputDir);
    } catch (err) {
      this.logger.error(
        `Error generating plan report: ${getErrorMessage(err)}`
      );
      const error = GenerateReportErrorEnum.SERVER_ERROR;

      return this.handleReportGenerationError(
        {
          generationId,
          collectiviteId: collectiviteId,
          planId: request.planId,
          userId: userId,
          reportName: reportName,
        },
        mediaDir,
        outputDir,
        error
      );
    }

    return {
      success: true,
      data: { reportId: generationId },
    };
  }
}
