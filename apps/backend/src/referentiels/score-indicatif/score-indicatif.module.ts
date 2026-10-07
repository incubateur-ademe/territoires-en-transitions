import { Module } from '@nestjs/common';
import { IndicateursModule } from '@tet/backend/indicateurs/indicateurs.module';
import { CollectivitesModule } from '@tet/backend/collectivites/collectivites.module';
import { PersonnalisationsModule } from '@tet/backend/collectivites/personnalisations/personnalisations.module';
import { ReferentielsCoreModule } from '@tet/backend/referentiels/referentiels-core.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { BuildEvaluationContextService } from './build-evaluation-context.service';
import { GetIndicateursAssociesService } from './get-indicateurs-associes.service';
import { ScoreIndicatifRepository } from './score-indicatif.repository';
import { ScoreIndicatifRouter } from './score-indicatif.router';
import { ScoreIndicatifService } from './score-indicatif.service';

@Module({
  imports: [
    CollectivitesModule,
    PersonnalisationsModule,
    IndicateursModule,
    ReferentielsCoreModule,
    TransactionModule,
  ],
  providers: [
    ScoreIndicatifRepository,
    GetIndicateursAssociesService,
    BuildEvaluationContextService,
    ScoreIndicatifService,
    ScoreIndicatifRouter,
  ],
  exports: [ScoreIndicatifRouter, ScoreIndicatifService],
})
export class ScoreIndicatifModule {}
