import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { ConfigurationModule } from '../../config/configuration.module';
import ConfigurationService from '../../config/configuration.service';

@Module({
  imports: [
    DrizzleModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [ConfigurationService],
      useFactory: (config: ConfigurationService) => ({
        drizzle,
        connection: {
          connectionString: config.get('SUPABASE_DATABASE_URL'),
          application_name: 'Tools Automation Api',
          connectionTimeoutMillis: 5_000,
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
