import { ImportPersonnalisationQuestionController } from '@/backend/personnalisations/import-personnalisation-questions/import-personnalisation-question.controller';
import ImportPersonnalisationQuestionService from '@/backend/personnalisations/import-personnalisation-questions/import-personnalisation-question.service';
import ListPersonnalisationQuestionsService from '@/backend/personnalisations/list-personnalisation-questions/list-personnalisation-questions.service';
import { SheetModule } from '@/backend/utils/google-sheets/sheet.module';
import { Module } from '@nestjs/common';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { AuthModule } from '../users/auth.module';
import PersonnalisationsExpressionService from './services/personnalisations-expression.service';
import PersonnalisationsService from './services/personnalisations-service';

@Module({
  imports: [CollectivitesModule, AuthModule, SheetModule],
  providers: [
    PersonnalisationsExpressionService,
    PersonnalisationsService,
    ImportPersonnalisationQuestionService,
    ListPersonnalisationQuestionsService,
  ],
  exports: [
    PersonnalisationsExpressionService,
    PersonnalisationsService,
    ImportPersonnalisationQuestionService,
    ListPersonnalisationQuestionsService,
  ],
  controllers: [ImportPersonnalisationQuestionController],
})
export class PersonnalisationsModule {}
