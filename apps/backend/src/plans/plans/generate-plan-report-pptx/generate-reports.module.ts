import { Module } from '@nestjs/common';
import { CollectivitesModule } from '@tet/backend/collectivites/collectivites.module';
import { PersonnalisationsModule } from '@tet/backend/collectivites/personnalisations/personnalisations.module';
import { IndicateursModule } from '@tet/backend/indicateurs/indicateurs.module';
import { AuthModule } from '@tet/backend/users/auth.module';
import { EchartsModule } from '@tet/backend/utils/echarts/echarts.module';
import { FichesModule } from '../../fiches/fiches.module';
import { PlanModule } from '../plans.module';
import { GenerateReportsController } from './generate-reports.controller';
import { GenerateReportsService } from './generate-reports.service';

@Module({
  imports: [
    AuthModule,
    CollectivitesModule,
    PersonnalisationsModule,
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
