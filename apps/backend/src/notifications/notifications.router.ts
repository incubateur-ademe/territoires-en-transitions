import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly notificationsService: NotificationsService
  ) {}

  router = this.trpc.router({
    sendPendingNotifications: this.trpc.serviceRoleProcedure.mutation(() =>
      this.notificationsService.sendPendingNotifications()
    ),
  });
}
