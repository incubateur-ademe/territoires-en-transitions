import { TableauDeBordCollectiviteRouter } from '@/backend/collectivites/tableau-de-bord/tableau-de-bord-collectivite.router';
import TableauDeBordCollectiviteService from '@/backend/collectivites/tableau-de-bord/tableau-de-bord-collectivite.service';
import { FichesActionModule } from '@/backend/plans/fiches/fiches.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [FichesActionModule],
  providers: [
    TableauDeBordCollectiviteService,
    TableauDeBordCollectiviteRouter,
  ],
  exports: [TableauDeBordCollectiviteService, TableauDeBordCollectiviteRouter],
})
export class TableauDeBordModule {}
