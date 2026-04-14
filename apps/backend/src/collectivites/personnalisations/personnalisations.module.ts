import { Module } from '@nestjs/common';
import { ImportPersonnalisationQuestionController } from '@tet/backend/collectivites/personnalisations/import-personnalisation-questions/import-personnalisation-question.controller';
import ImportPersonnalisationQuestionService from '@tet/backend/collectivites/personnalisations/import-personnalisation-questions/import-personnalisation-question.service';
import { ListPersonnalisationQuestionsRouter } from '@tet/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.router';
import ListPersonnalisationQuestionsService from '@tet/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.service';
import { ListPersonnalisationReglesRouter } from '@tet/backend/collectivites/personnalisations/list-personnalisation-regles/list-personnalisation-regles.router';
import { ListPersonnalisationReglesService } from '@tet/backend/collectivites/personnalisations/list-personnalisation-regles/list-personnalisation-regles.service';
import { ListPersonnalisationReponsesRepository } from '@tet/backend/collectivites/personnalisations/list-personnalisation-reponses/list-personnalisation-reponses.repository';
import { ListPersonnalisationReponsesService } from '@tet/backend/collectivites/personnalisations/list-personnalisation-reponses/list-personnalisation-reponses.service';
import { ListPersonnalisationThematiquesRouter } from '@tet/backend/collectivites/personnalisations/list-personnalisation-thematiques/list-personnalisation-thematiques.router';
import { ListPersonnalisationThematiquesService } from '@tet/backend/collectivites/personnalisations/list-personnalisation-thematiques/list-personnalisation-thematiques.service';
import { PersonnalisationsRouter } from '@tet/backend/collectivites/personnalisations/personnalisations.router';
import { SetPersonnalisationReponseRepository } from '@tet/backend/collectivites/personnalisations/set-personnalisation-reponse/set-personnalisation-reponse.repository';
import { SetPersonnalisationReponseRouter } from '@tet/backend/collectivites/personnalisations/set-personnalisation-reponse/set-personnalisation-reponse.router';
import { SetPersonnalisationReponseService } from '@tet/backend/collectivites/personnalisations/set-personnalisation-reponse/set-personnalisation-reponse.service';
import { ReferentielsCoreModule } from '@tet/backend/referentiels/referentiels-core.module';
import { SheetModule } from '@tet/backend/utils/google-sheets/sheet.module';
import { TrackingModule } from '@tet/backend/utils/tracking/tracking.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { UsersModule } from '../../users/users.module';
import { CollectivitesCoreModule } from '../collectivites-core.module';
import PersonnalisationsExpressionService from './services/personnalisations-expression.service';
import PersonnalisationsService from './services/personnalisations-service';

@Module({
  imports: [
    CollectivitesCoreModule,
    ReferentielsCoreModule,
    UsersModule,
    SheetModule,
    TransactionModule,
    TrackingModule,
  ],
  providers: [
    PersonnalisationsExpressionService,
    PersonnalisationsService,
    ImportPersonnalisationQuestionService,
    ListPersonnalisationQuestionsService,
    ListPersonnalisationQuestionsRouter,
    SetPersonnalisationReponseService,
    SetPersonnalisationReponseRepository,
    SetPersonnalisationReponseRouter,
    ListPersonnalisationReponsesService,
    ListPersonnalisationReponsesRepository,
    ListPersonnalisationReglesService,
    ListPersonnalisationReglesRouter,
    ListPersonnalisationThematiquesService,
    ListPersonnalisationThematiquesRouter,
    PersonnalisationsRouter,
  ],
  exports: [
    PersonnalisationsExpressionService,
    PersonnalisationsService,
    ImportPersonnalisationQuestionService,
    ListPersonnalisationQuestionsService,
    SetPersonnalisationReponseService,
    PersonnalisationsRouter,
  ],
  controllers: [ImportPersonnalisationQuestionController],
})
export class PersonnalisationsModule {}
