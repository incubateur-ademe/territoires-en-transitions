import { Module } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { FicheActionRepository } from '@tet/backend/plans/fiches/fiche-action.repository';
import { ConfigurationModule } from '@tet/backend/utils/config/configuration.module';
import { DatabaseModule } from '@tet/backend/utils/database/database.module';
import { LlmModule } from '@tet/backend/utils/llm/llm.module';
import { AnalysisRunTableRepository } from '../analysis-run-table.repository';
import { ClassifyBatchService } from '../classify-batch/classify-batch.service';
import { CollectiviteVoletGesRepository } from '../collectivite-volet-ges.repository';
import { EnjeuRepositories } from '../enjeu.repositories';
import { FicheActionAnalysisRepository } from '../fiche-action-analysis.repository';
import { FicheActionVoletGesRepository } from '../fiche-action-volet-ges.repository';
import { ScoreMobilisationService } from '../score-mobilisation/score-mobilisation.service';
import { AnalysisRunRepository } from './analysis-run.repository';
import { AnalyzeFichesService } from './analyze-fiches.service';
import { FicheAnalysisStatusRepository } from './fiche-analysis-status.repository';
import { FicheCandidateRepository } from './fiche-candidate.repository';
import { FicheTextRepository } from './fiche-text.repository';

@Module({
  imports: [ConfigurationModule, DatabaseModule, LlmModule],
  providers: [
    AnalyzeFichesService,
    ClassifyBatchService,
    ScoreMobilisationService,
    CollectivitesService,
    EnjeuRepositories,
    FicheActionVoletGesRepository,
    CollectiviteVoletGesRepository,
    FicheActionRepository,
    { provide: FicheCandidateRepository, useExisting: FicheActionRepository },
    { provide: FicheTextRepository, useExisting: FicheActionRepository },
    {
      provide: FicheAnalysisStatusRepository,
      useClass: FicheActionAnalysisRepository,
    },
    { provide: AnalysisRunRepository, useClass: AnalysisRunTableRepository },
  ],
})
export class AnalyzeFichesModule {}
