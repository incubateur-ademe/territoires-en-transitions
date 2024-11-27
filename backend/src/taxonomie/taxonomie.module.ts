import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { ConfigurationModule } from '../config/configuration.module';
import TagService from '../taxonomie/services/tag.service';
import {
  GetCategoriesByCollectiviteRouter
} from '../taxonomie/routers/get-categories-by-collectivite.router';

@Module({
  imports: [
    ConfigurationModule,
    CommonModule,
    AuthModule,
    CollectivitesModule,
  ],
  providers: [
    TagService,
    GetCategoriesByCollectiviteRouter
  ],
  exports: [TagService, GetCategoriesByCollectiviteRouter],
  controllers: [],
})
export class TaxonomieModule {}

