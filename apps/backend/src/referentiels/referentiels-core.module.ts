import { Module } from '@nestjs/common';
import { DatabaseModule } from '@tet/backend/utils/database/database.module';
import { GetReferentielDefinitionService } from './definitions/get-referentiel-definition/get-referentiel-definition.service';

/**
 * Fournit GetReferentielDefinitionService sans dépendre du reste du domaine
 * référentiels (évite le cycle PersonnalisationsModule <-> ReferentielsModule).
 */
@Module({
  imports: [DatabaseModule],
  providers: [GetReferentielDefinitionService],
  exports: [GetReferentielDefinitionService],
})
export class ReferentielsCoreModule {}
