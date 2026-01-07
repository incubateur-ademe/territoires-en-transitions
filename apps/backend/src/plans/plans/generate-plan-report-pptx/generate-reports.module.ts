import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CollectivitesModule } from '@tet/backend/collectivites/collectivites.module';
import { PersonnalisationsModule } from '@tet/backend/collectivites/personnalisations/personnalisations.module';
import { IndicateursModule } from '@tet/backend/indicateurs/indicateurs.module';
import { AuthModule } from '@tet/backend/users/users.module';
import { EchartsModule } from '@tet/backend/utils/echarts/echarts.module';
import { NotificationsModule } from '@tet/backend/utils/notifications/notifications.module';
import { FichesModule } from '../../fiches/fiches.module';
import { PlansUtilsModule } from '../../utils/plans-utils.module';
import { PlanModule } from '../plans.module';
import { GenerateReportsRouter } from './generate-reports.router';
import {
  GenerateReportsService,
  PLAN_REPORT_GENERATION_QUEUE_NAME,
} from './generate-reports.service';
import { GenerateReportsWorker } from './generate-reports.worker';
import { NotifyReportService } from './notify-report.service';
import { ReportGenerationRepository } from './report-generation.repository';

@Module({
  imports: [
    BullModule.registerQueue({
      name: PLAN_REPORT_GENERATION_QUEUE_NAME,
    }),
    PlansUtilsModule,
    AuthModule,
    CollectivitesModule,
    PersonnalisationsModule,
    PlanModule,
    FichesModule,
    IndicateursModule,
    EchartsModule,
    NotificationsModule,
  ],
  providers: [
    GenerateReportsService,
    GenerateReportsRouter,
    ReportGenerationRepository,
    NotifyReportService,
    GenerateReportsWorker,
  ],
  exports: [GenerateReportsService, GenerateReportsRouter],
})
export class GenerateReportsModule {}
