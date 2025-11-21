import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { sendPendingNotificationsInputSchema } from './models/send-pending-notifications.input';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly notificationsService: NotificationsService
  ) {}

  router = this.trpc.router({
    sendPendingNotifications: this.trpc.serviceRoleProcedure
      .input(sendPendingNotificationsInputSchema)
      .mutation(({ input }) =>
        this.notificationsService.sendPendingNotifications(input)
      ),
  });
}
