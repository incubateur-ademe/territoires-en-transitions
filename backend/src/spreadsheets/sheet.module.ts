import { Module } from '@nestjs/common';
import SheetService from './services/sheet.service';

@Module({
  providers: [SheetService],
  exports: [SheetService],
  controllers: [],
})
export class SheetModule {}
