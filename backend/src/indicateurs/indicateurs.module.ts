import { Module } from '@nestjs/common';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { SheetModule } from '../spreadsheets/sheet.module';
import { TrajectoiresController } from './controllers/trajectoires.controller';
import IndicateursService from './service/indicateurs.service';
import TrajectoiresService from './service/trajectoires.service';

@Module({
  imports: [CommonModule, CollectivitesModule, SheetModule],
  providers: [IndicateursService, TrajectoiresService],
  exports: [IndicateursService, TrajectoiresService],
  controllers: [TrajectoiresController],
})
export class IndicateursModule {}
