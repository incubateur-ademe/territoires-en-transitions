import { forwardRef, Module } from '@nestjs/common';
import { TableauDeBordCollectiviteRouter } from '@tet/backend/collectivites/tableau-de-bord/tableau-de-bord-collectivite.router';
import TableauDeBordCollectiviteService from '@tet/backend/collectivites/tableau-de-bord/tableau-de-bord-collectivite.service';
import { FichesModule } from '@tet/backend/plans/fiches/fiches.module';
import { PlanModule } from '@tet/backend/plans/plans/plans.module';

@Module({
  imports: [forwardRef(() => FichesModule), forwardRef(() => PlanModule)],
  providers: [
    TableauDeBordCollectiviteService,
    TableauDeBordCollectiviteRouter,
  ],
  exports: [TableauDeBordCollectiviteService, TableauDeBordCollectiviteRouter],
})
export class TableauDeBordModule {}
