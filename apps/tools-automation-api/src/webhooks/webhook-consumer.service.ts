import { WEBHOOK_NOTIFICATIONS_QUEUE_NAME } from '@/domain/utils';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor(WEBHOOK_NOTIFICATIONS_QUEUE_NAME)
@Injectable()
export class WebhookConsumerService extends WorkerHost {
  private readonly logger = new Logger(WebhookConsumerService.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id}: ${JSON.stringify(job.data)}`);

    return {};
  }
}
