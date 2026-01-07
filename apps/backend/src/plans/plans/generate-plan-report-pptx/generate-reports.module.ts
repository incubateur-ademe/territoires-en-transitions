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
import { GenerateReportsController } from './generate-reports.controller';
import { GenerateReportsService } from './generate-reports.service';
import { NotifyReportService } from './notify-report.service';
import { ReportGenerationRepository } from './report-generation.repository';

@Module({
  imports: [
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
    ReportGenerationRepository,
    NotifyReportService,
  ],
  exports: [GenerateReportsService],
  controllers: [GenerateReportsController],
})
export class GenerateReportsModule {}
