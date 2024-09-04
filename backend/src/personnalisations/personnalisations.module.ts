import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { PersonnalisationsController } from './controllers/personnalisations.controller';
import ExpressionParserService from './services/expression-parser.service';
import PersonnalisationsService from './services/personnalisations-service';

@Module({
  imports: [CommonModule, CollectivitesModule, AuthModule],
  providers: [ExpressionParserService, PersonnalisationsService],
  exports: [ExpressionParserService, PersonnalisationsService],
  controllers: [PersonnalisationsController],
})
export class PersonnalisationsModule {}
