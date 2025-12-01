import { Injectable } from '@nestjs/common';
import { sendPendingNotificationsInputSchema } from '@tet/backend/utils/notifications/models/send-pending-notifications.input';
import { TrpcClientService } from '../utils/trpc/trpc-client.service';

@Injectable()
export class CronNotificationsService {
  private readonly trpcClient = this.trpcClientService.getClient();

  constructor(private readonly trpcClientService: TrpcClientService) {}

  sendPendingNotifications(jobData: unknown) {
    if (jobData) {
      const result = sendPendingNotificationsInputSchema.safeParse(jobData);
      if (result.success)
        return this.trpcClient.notifications.sendPendingNotifications.mutate(
          result.data
        );
    }
    return this.trpcClient.notifications.sendPendingNotifications.mutate();
  }
}
