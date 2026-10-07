import { Module } from '@nestjs/common';
import { UsersModule } from '@tet/backend/users/users.module';
import { DemarchesRouter } from './demarches.router';
import { ListPlanLinksRouter } from './list-plan-links/list-plan-links.router';
import { ListPlanLinksService } from './list-plan-links/list-plan-links.service';
import { PcaetModule } from './pcaet/pcaet.module';

@Module({
  imports: [PcaetModule, UsersModule],
  providers: [ListPlanLinksService, ListPlanLinksRouter, DemarchesRouter],
  exports: [DemarchesRouter],
})
export class DemarchesModule {}
