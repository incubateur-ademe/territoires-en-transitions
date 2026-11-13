import { IndicateurReferenceExterneRepository } from '@tet/backend/indicateurs/indicateur/indicateur-reference-externe.repository';
import { Module } from '@nestjs/common';
import { ElectrificationDataService } from './electrification-data.service';
import { PublishElectrificationDataRouter } from './publish-electrification-data.router';
import { PublishElectrificationDataService } from './publish-electrification-data.service';
import { ReadGristService } from '@tet/backend/utils/grist/read-grist.service';
import { PrepareElectrificationDataService } from './prepare-electrification-data.service';
import { ValidateElectrificationDataService } from './validate-electrification-data.service';
import { ReadElectrificationGristService } from './sources/read-electrification-grist.service';
import { ReadElectrificationLaureatsService } from './sources/read-electrification-laureats.service';

@Module({
  providers: [
    IndicateurReferenceExterneRepository,
    ElectrificationDataService,
    ReadGristService,
    PrepareElectrificationDataService,
    ValidateElectrificationDataService,
    PublishElectrificationDataService,
    PublishElectrificationDataRouter,
    ReadElectrificationGristService,
    ReadElectrificationLaureatsService,
  ],
  exports: [ElectrificationDataService, PublishElectrificationDataRouter],
})
export class ElectrificationDataModule {}
