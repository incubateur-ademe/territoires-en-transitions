import { TableauDeBordCollectiviteRouter } from '@/backend/collectivites/tableau-de-bord/tableau-de-bord-collectivite.router';
import TableauDeBordCollectiviteService from '@/backend/collectivites/tableau-de-bord/tableau-de-bord-collectivite.service';
import { FichesModule } from '@/backend/plans/fiches/fiches.module';
import { PlanModule } from '@/backend/plans/plans/plans.module';
import { forwardRef, Module } from '@nestjs/common';

@Module({
  imports: [forwardRef(() => FichesModule), forwardRef(() => PlanModule)],
  providers: [
    TableauDeBordCollectiviteService,
    TableauDeBordCollectiviteRouter,
  ],
  exports: [TableauDeBordCollectiviteService, TableauDeBordCollectiviteRouter],
})
export class TableauDeBordModule {}
