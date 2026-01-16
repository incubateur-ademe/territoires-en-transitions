import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CollectivitesModule } from '@tet/backend/collectivites/collectivites.module';
import { PersonnalisationsModule } from '@tet/backend/collectivites/personnalisations/personnalisations.module';
import { IndicateursModule } from '@tet/backend/indicateurs/indicateurs.module';
import { UsersModule } from '@tet/backend/users/users.module';
import { EchartsModule } from '@tet/backend/utils/echarts/echarts.module';
import { NotificationsModule } from '@tet/backend/utils/notifications/notifications.module';
import { FichesModule } from '../fiches/fiches.module';
import { PlanModule } from '../plans/plans.module';
import { PlansUtilsModule } from '../utils/plans-utils.module';
import {
  GenerateReportsApplicationService,
  PLAN_REPORT_GENERATION_QUEUE_NAME,
} from './generate-plan-report-pptx/generate-reports.application-service';
import { GenerateReportsRouter } from './generate-plan-report-pptx/generate-reports.router';
import { GenerateReportsWorker } from './generate-plan-report-pptx/generate-reports.worker';
import { NotifyReportService } from './generate-plan-report-pptx/notify-report.service';
import { PptBuilderService } from './generate-plan-report-pptx/ppt-builder.service';
import { ReportGenerationRepository } from './generate-plan-report-pptx/report-generation.repository';

@Module({
  imports: [
    BullModule.registerQueue({
      name: PLAN_REPORT_GENERATION_QUEUE_NAME,
    }),
    PlansUtilsModule,
    UsersModule,
    CollectivitesModule,
    PersonnalisationsModule,
    PlanModule,
    FichesModule,
    IndicateursModule,
    EchartsModule,
    NotificationsModule,
  ],
  providers: [
    GenerateReportsApplicationService,
    GenerateReportsRouter,
    ReportGenerationRepository,
    NotifyReportService,
    GenerateReportsWorker,
    PptBuilderService,
  ],
  exports: [GenerateReportsApplicationService, GenerateReportsRouter],
})
export class ReportsModule {}
