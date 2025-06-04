import { Module } from '@nestjs/common';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { AuthModule } from '../users/auth.module';
import PersonnalisationsExpressionService from './services/personnalisations-expression.service';
import PersonnalisationsService from './services/personnalisations-service';

@Module({
  imports: [CollectivitesModule, AuthModule],
  providers: [PersonnalisationsExpressionService, PersonnalisationsService],
  exports: [PersonnalisationsExpressionService, PersonnalisationsService],
  controllers: [],
})
export class PersonnalisationsModule {}
