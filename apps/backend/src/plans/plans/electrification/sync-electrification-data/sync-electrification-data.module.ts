import { IndicateurReferenceExterneRepository } from '@tet/backend/indicateurs/indicateur/indicateur-reference-externe.repository';
import { Module } from '@nestjs/common';
import { ConfigurationModule } from '@tet/backend/utils/config/configuration.module';
import { DatabaseModule } from '@tet/backend/utils/database/database.module';
import { ReadGristService } from '@tet/backend/utils/grist/read-grist.service';
import { ElectrificationDataService } from '../publish-electrification-data/electrification-data.service';
import { PrepareElectrificationDataService } from '../publish-electrification-data/prepare-electrification-data.service';
import { ReadElectrificationGristService } from '../publish-electrification-data/sources/read-electrification-grist.service';
import { ReadElectrificationLaureatsService } from '../publish-electrification-data/sources/read-electrification-laureats.service';
import { ValidateElectrificationDataService } from '../publish-electrification-data/validate-electrification-data.service';
import { SyncElectrificationDataService } from './sync-electrification-data.service';

/** Module de maintenance, sans workers, serveur HTTP ni fournisseur IA. */
@Module({
  imports: [ConfigurationModule, DatabaseModule],
  providers: [
    IndicateurReferenceExterneRepository,
    ReadGristService,
    ElectrificationDataService,
    PrepareElectrificationDataService,
    ReadElectrificationGristService,
    ReadElectrificationLaureatsService,
    ValidateElectrificationDataService,
    SyncElectrificationDataService,
  ],
})
export class SyncElectrificationDataModule {}
