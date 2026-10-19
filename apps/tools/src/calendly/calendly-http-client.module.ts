import { Module } from '@nestjs/common';
import { HttpClientModule } from '@nestjs/http-client';
import { ConfigurationModule } from '../config/configuration.module';
import ConfigurationService from '../config/configuration.service';

@Module({
  imports: [
    HttpClientModule.registerAsync({
      name: 'calendly',
      imports: [ConfigurationModule],
      inject: [ConfigurationService],
      useFactory: (config: ConfigurationService) => ({
        baseUrl: 'https://api.calendly.com',
        timeout: 10_000,
        retry: false,
        throwOnHttpError: false,
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${config.get('CALENDLY_ACCESS_TOKEN')}`,
        },
      }),
    }),
  ],
  exports: [HttpClientModule],
})
export class CalendlyHttpClientModule {}
