import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SheetModule } from './spreadsheets/SheetModule';

@Module({
  imports: [SheetModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
