import { Module } from '@nestjs/common';
import { DatabaseModule } from '@tet/backend/utils/database/database.module';
import { UsersModule } from '../users/users.module';
import { CollectivitePreferencesRepository } from './collectivite-preferences/collectivite-preferences.repository';
import { CollectivitePreferencesService } from './collectivite-preferences/collectivite-preferences.service';
import { CollectiviteReferentielModeService } from './collectivite-referentiel-mode/collectivite-referentiel-mode.service';
import { CollectiviteCompetencesRepository } from './shared/collectivite-competences.repository';
import { CollectiviteCommunesMembresRepository } from './shared/collectivite-communes-membres.repository';
import { BibliothequeFichierRepository } from './documents/bibliotheque-fichier.repository';
import { LabellisationDocumentsPermissionService } from './documents/labellisation-documents-permission.service';
import { CollectiviteBucketRepository } from './documents/collectivite-bucket.repository';
import { ListDocumentsByScopeRepository } from './documents/list-documents-by-scope/list-documents-by-scope.repository';
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
    BibliothequeFichierRepository,
    LabellisationDocumentsPermissionService,
    CollectiviteBucketRepository,
    CollectiviteCompetencesRepository,
    CollectiviteCommunesMembresRepository,
    ListDocumentsByScopeRepository,
  ],
  exports: [
    CollectivitesService,
    CollectivitePreferencesService,
    CollectiviteReferentielModeService,
    BibliothequeFichierRepository,
    LabellisationDocumentsPermissionService,
    CollectiviteBucketRepository,
    CollectiviteCompetencesRepository,
    CollectiviteCommunesMembresRepository,
    ListDocumentsByScopeRepository,
  ],
})
export class CollectivitesCoreModule {}
