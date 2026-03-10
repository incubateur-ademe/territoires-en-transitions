import { Module } from '@nestjs/common';
import { PartnerFichesController } from './partner-fiches.controller';
import { PartnerFichesService } from './partner-fiches.service';
import { PartnerPlansController } from './partner-plans.controller';
import { PartnerPlansService } from './partner-plans.service';

@Module({
  providers: [PartnerPlansService, PartnerFichesService],
  controllers: [PartnerPlansController, PartnerFichesController],
})
export class PartnerApiModule {}
