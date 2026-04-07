import { Module } from '@nestjs/common';
import { DatabaseModule } from '@tet/backend/utils/database/database.module';
import CollectivitesService from './services/collectivites.service';

/**
 * Fournit CollectivitesService sans dépendre du reste du domaine collectivités
 * (évite la dépendance circulaire avec PersonnalisationsModule).
 */
@Module({
  imports: [DatabaseModule],
  providers: [CollectivitesService],
  exports: [CollectivitesService],
})
export class CollectivitesCoreModule {}
