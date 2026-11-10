import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { TrackSnapshotService } from './track-snapshot.service';

@Injectable()
export class TrackSnapshotRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly trackSnapshotService: TrackSnapshotService
  ) {}

  router = this.trpc.router({
    /**
     * Photo quotidienne du stock des démarches PCAET dans PostHog, appelée par
     * le planificateur. Réservée au service role : elle lit toutes les
     * collectivités.
     */
    trackSnapshot: this.trpc.serviceRoleProcedure
      .input(z.object({}))
      .mutation(() => this.trackSnapshotService.trackSnapshot()),
  });
}
