import { Module } from '@nestjs/common';
import { PostHogApiInterceptor } from './posthog-api.interceptor';
import { PostHogService } from './posthog.service';

@Module({
  providers: [PostHogService, PostHogApiInterceptor],
  exports: [PostHogService, PostHogApiInterceptor],
})
export class TrackingModule {}
