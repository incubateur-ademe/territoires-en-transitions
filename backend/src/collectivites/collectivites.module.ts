import { Module } from '@nestjs/common';
import CollectivitesService from './services/collectivites.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [CollectivitesService],
  exports: [CollectivitesService],
  controllers: [],
})
export class CollectivitesModule {}