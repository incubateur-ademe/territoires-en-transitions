import { Module } from '@nestjs/common';
import { DemarchesRouter } from './demarches.router';
import { PcaetModule } from './pcaet/pcaet.module';

@Module({
  imports: [PcaetModule],
  providers: [DemarchesRouter],
  exports: [DemarchesRouter],
})
export class DemarchesModule {}
