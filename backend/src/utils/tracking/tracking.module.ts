import { Module } from '@nestjs/common';
import { ApiTrackingInterceptor } from './api-tracking.interceptor';
import { PostHogEventTracker } from './posthog-event-tracker';
import { TrackingService } from './tracking.service';

@Module({
  providers: [
    {
      provide: 'EventTracker',
      useClass: PostHogEventTracker,
    },
    TrackingService,
    ApiTrackingInterceptor,
  ],
  exports: [TrackingService, ApiTrackingInterceptor],
})
export class TrackingModule {}
