import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { GetCategoriesByCollectiviteRouter } from '../taxonomie/routers/get-categories-by-collectivite.router';
import TagService from '../taxonomie/services/tag.service';
import { ConfigurationModule } from '../utils/config/configuration.module';

@Module({
  imports: [ConfigurationModule, CommonModule, AuthModule, CollectivitesModule],
  providers: [TagService, GetCategoriesByCollectiviteRouter],
  exports: [TagService, GetCategoriesByCollectiviteRouter],
  controllers: [],
})
export class TaxonomieModule {}
