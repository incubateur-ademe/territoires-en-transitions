import { CollectivitesModule } from '@/backend/collectivites/collectivites.module';
import { IndicateursModule } from '@/backend/indicateurs/indicateurs.module';
import { EchartsModule } from '@/backend/utils/echarts/echarts.module';
import { Module } from '@nestjs/common';
import { FichesModule } from '../../fiches/fiches.module';
import { PlanModule } from '../plans.module';
import { GenerateReportsController } from './generate-reports.controller';
import { GenerateReportsService } from './generate-reports.service';

@Module({
  imports: [
    CollectivitesModule,
    PlanModule,
    FichesModule,
    IndicateursModule,
    EchartsModule,
  ],
  providers: [GenerateReportsService],
  exports: [GenerateReportsService],
  controllers: [GenerateReportsController],
})
export class GenerateReportsModule {}
