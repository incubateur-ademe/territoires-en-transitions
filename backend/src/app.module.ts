import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SheetModule } from './spreadsheets/sheet.module';
import { CommonModule } from './common/common.module';
import { CollectivitesModule } from './collectivites/collectivites.module';

@Module({
  imports: [CommonModule, SheetModule, CollectivitesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
