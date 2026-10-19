import { Module } from '@nestjs/common';
import { HttpClientModule } from '@nestjs/http-client';
import { ConfigurationModule } from '../config/configuration.module';
import ConfigurationService from '../config/configuration.service';

@Module({
  imports: [
    HttpClientModule.registerAsync({
      name: 'sirene',
      imports: [ConfigurationModule],
      inject: [ConfigurationService],
      useFactory: (config: ConfigurationService) => ({
        baseUrl: config.get('SIRENE_API_URL'),
        timeout: 10_000,
        retry: false,
        throwOnHttpError: false,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          accept: 'application/json',
          'accept-encoding': 'gzip',
          'X-INSEE-Api-Key-Integration': config.get('SIRENE_API_KEY'),
        },
      }),
    }),
  ],
  exports: [HttpClientModule],
})
export class SireneHttpClientModule {}
