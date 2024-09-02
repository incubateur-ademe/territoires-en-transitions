import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { SheetModule } from '../spreadsheets/sheet.module';
import { TrpcModule } from '../trpc/trpc.module';
import { IndicateursController } from './controllers/indicateurs.controller';
import { TrajectoiresController } from './controllers/trajectoires.controller';
import { TrajectoiresRouter } from './routers/trajectoires.router';
import IndicateursService from './services/indicateurs.service';
import IndicateurSourcesService from './services/indicateurSources.service';
import TrajectoiresDataService from './services/trajectoires-data.service';
import TrajectoiresSpreadsheetService from './services/trajectoires-spreadsheet.service';
import TrajectoiresXlsxService from './services/trajectoires-xlsx.service';

@Module({
  imports: [
    TrpcModule,
    CommonModule,
    AuthModule,
    CollectivitesModule,
    SheetModule,
  ],
  providers: [
    IndicateurSourcesService,
    IndicateursService,
    TrajectoiresDataService,
    TrajectoiresSpreadsheetService,
    TrajectoiresXlsxService,
    TrajectoiresRouter,
  ],
  exports: [IndicateurSourcesService, IndicateursService, TrajectoiresRouter],
  controllers: [IndicateursController, TrajectoiresController],
})
export class IndicateursModule {}
