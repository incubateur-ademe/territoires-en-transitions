import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CollectivitesModule } from './collectivites/collectivites.module';
import { CommonModule } from './common/common.module';
import { IndicateursModule } from './indicateurs/indicateurs.module';
import { SheetModule } from './spreadsheets/sheet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: process.env.NODE_ENV === 'production', // In production, environment variables are set by the deployment
    }),
    CommonModule,
    SheetModule,
    CollectivitesModule,
    IndicateursModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
