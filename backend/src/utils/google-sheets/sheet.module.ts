import { Module } from '@nestjs/common';
import SheetService from './sheet.service';

@Module({
  providers: [SheetService],
  exports: [SheetService],
  controllers: [],
})
export class SheetModule {}
