import { Module } from '@nestjs/common';
import { ApiTrackingInterceptor } from './api-tracking.interceptor';
import { ListFeatureFlagsRouter } from './list-feature-flags.router';
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
    ListFeatureFlagsRouter,
  ],
  exports: [TrackingService, ApiTrackingInterceptor, ListFeatureFlagsRouter],
})
export class TrackingModule {}
