import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigurationModule } from '../config/configuration.module';
import ConfigurationService from '../config/configuration.service';
import { RateLimitStorageService } from './rate-limit-storage.service';

@Module({
  imports: [ConfigurationModule],
  providers: [RateLimitStorageService],
  exports: [RateLimitStorageService],
})
class RateLimitStorageModule {}

@Module({
  imports: [
    RateLimitStorageModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigurationModule, RateLimitStorageModule],
      inject: [ConfigurationService, RateLimitStorageService],
      useFactory: async (
        config: ConfigurationService,
        storage: RateLimitStorageService
      ) => {
        await storage.onModuleInit();
        return {
          storage,
          throttlers: [
            {
              ttl: config.get('PUBLIC_API_THROTTLE_TTL'),
              limit: config.get('PUBLIC_API_THROTTLE_LIMIT'),
            },
          ],
        };
      },
    }),
  ],
  exports: [ThrottlerModule, RateLimitStorageModule],
})
export class ThrottlingModule {}
