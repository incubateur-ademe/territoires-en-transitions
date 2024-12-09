import { CollectivitesModule } from '@/backend/collectivites';
import { CommonModule } from '@/backend/utils';
import { Module } from '@nestjs/common';
import { PersonnalisationsController } from './controllers/personnalisations.controller';
import ExpressionParserService from './services/expression-parser.service';
import PersonnalisationsService from './services/personnalisations-service';

@Module({
  imports: [CommonModule, CollectivitesModule],
  providers: [ExpressionParserService, PersonnalisationsService],
  exports: [ExpressionParserService, PersonnalisationsService],
  controllers: [PersonnalisationsController],
})
export class PersonnalisationsModule {}
