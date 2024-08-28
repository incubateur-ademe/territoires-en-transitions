import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CollectivitesModule } from './collectivites/collectivites.module';
import { CommonModule } from './common/common.module';
import { IndicateursModule } from './indicateurs/indicateurs.module';
import { SheetModule } from './spreadsheets/sheet.module';
import { TrpcRouter } from './trpc.router';
import { TrpcModule } from './trpc/trpc.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: process.env.NODE_ENV === 'production', // In production, environment variables are set by the deployment
    }),
    TrpcModule,
    CommonModule,
    SheetModule,
    CollectivitesModule,
    IndicateursModule,
    AuthModule,
  ],
  controllers: [],
  exports: [TrpcRouter],
  providers: [TrpcRouter],
})
export class AppModule {}
