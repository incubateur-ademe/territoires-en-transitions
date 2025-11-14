import { Injectable } from '@nestjs/common';
import { TrpcClientService } from '../utils/trpc/trpc-client.service';

@Injectable()
export class CronNotificationsService {
  private readonly trpcClient = this.trpcClientService.getClient();

  constructor(private readonly trpcClientService: TrpcClientService) {}

  sendPendingNotifications() {
    return this.trpcClient.notifications.sendPendingNotifications.mutate();
  }
}
