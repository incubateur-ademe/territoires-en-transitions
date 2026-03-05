import { Module } from '@nestjs/common';
import { ImportPersonnalisationQuestionController } from '@tet/backend/collectivites/personnalisations/import-personnalisation-questions/import-personnalisation-question.controller';
import ImportPersonnalisationQuestionService from '@tet/backend/collectivites/personnalisations/import-personnalisation-questions/import-personnalisation-question.service';
import ListPersonnalisationQuestionsService from '@tet/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.service';
import { SetPersonnalisationReponseService } from '@tet/backend/collectivites/personnalisations/set-personnalisation-reponse/set-personnalisation-reponse.service';
import { SheetModule } from '@tet/backend/utils/google-sheets/sheet.module';
import { UsersModule } from '../../users/users.module';
import { CollectivitesModule } from '../collectivites.module';
import { ListPersonnalisationReponsesRepository } from './list-personnalisation-reponses/list-personnalisation-reponses.repository';
import { ListPersonnalisationReponsesService } from './list-personnalisation-reponses/list-personnalisation-reponses.service';
import PersonnalisationsExpressionService from './services/personnalisations-expression.service';
import PersonnalisationsService from './services/personnalisations-service';
import { SetPersonnalisationReponseRepository } from './set-personnalisation-reponse/set-personnalisation-reponse.repository';

@Module({
  imports: [CollectivitesModule, UsersModule, SheetModule],
  providers: [
    PersonnalisationsExpressionService,
    PersonnalisationsService,
    ImportPersonnalisationQuestionService,
    ListPersonnalisationQuestionsService,
    SetPersonnalisationReponseService,
    SetPersonnalisationReponseRepository,
    ListPersonnalisationReponsesService,
    ListPersonnalisationReponsesRepository,
  ],
  exports: [
    PersonnalisationsExpressionService,
    PersonnalisationsService,
    ImportPersonnalisationQuestionService,
    ListPersonnalisationQuestionsService,
    SetPersonnalisationReponseService,
  ],
  controllers: [ImportPersonnalisationQuestionController],
})
export class PersonnalisationsModule {}
