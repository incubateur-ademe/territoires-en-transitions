import { Module } from '@nestjs/common';
import { DatabaseModule } from '@tet/backend/utils/database/database.module';
import { UsersModule } from '../users/users.module';
import { CollectivitePreferencesRepository } from './collectivite-preferences/collectivite-preferences.repository';
import { CollectivitePreferencesService } from './collectivite-preferences/collectivite-preferences.service';
import { CollectiviteReferentielModeService } from './collectivite-referentiel-mode/collectivite-referentiel-mode.service';
import { ReferentielModeGuard } from './collectivite-referentiel-mode/referentiel-mode-guard.service';
import CollectivitesService from './services/collectivites.service';

/**
 * Fournit CollectivitesService et CollectivitePreferencesService sans dépendre
 * du reste du domaine collectivités (évite la dépendance circulaire avec
 * PersonnalisationsModule).
 */
@Module({
  imports: [DatabaseModule, UsersModule],
  providers: [
    CollectivitesService,
    CollectivitePreferencesService,
    CollectivitePreferencesRepository,
    CollectiviteReferentielModeService,
    ReferentielModeGuard,
  ],
  exports: [
    CollectivitesService,
    CollectivitePreferencesService,
    CollectiviteReferentielModeService,
    ReferentielModeGuard,
  ],
})
export class CollectivitesCoreModule {}
