import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import ExpressionParserService from './services/expression-parser.service';
import PersonnalisationsService from './services/personnalisations-service';

@Module({
  imports: [CollectivitesModule, AuthModule],
  providers: [ExpressionParserService, PersonnalisationsService],
  exports: [ExpressionParserService, PersonnalisationsService],
  controllers: [],
})
export class PersonnalisationsModule {}
