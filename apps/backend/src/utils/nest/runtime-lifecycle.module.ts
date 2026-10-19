import { WorkerHost } from '@nestjs/bullmq';
import {
  Global,
  Injectable,
  Logger,
  Module,
  OnApplicationShutdown,
  OnModuleDestroy,
} from '@nestjs/common';
import { DiscoveryModule, DiscoveryService } from '@nestjs/core';
import { OutboxRelay } from '@nestjs/outbox';
import { shutdownTelemetry } from './telemetry-shutdown';

@Injectable()
export class RuntimeLifecycleService
  implements OnModuleDestroy, OnApplicationShutdown
{
  private readonly logger = new Logger(RuntimeLifecycleService.name);

  constructor(private readonly discovery: DiscoveryService) {}

  async onModuleDestroy() {
    const instances = this.discovery
      .getProviders()
      .map(({ instance }) => instance);
    const relays = [
      ...new Set(
        instances.filter(
          (instance): instance is OutboxRelay => instance instanceof OutboxRelay
        )
      ),
    ];
    const relayResults = await Promise.allSettled(
      relays.map((relay) => relay.stop())
    );
    if (relayResults.some((result) => result.status === 'rejected')) {
      this.logger.error('Could not stop every outbox relay');
    }

    const workers = instances.flatMap((instance) => {
      if (!(instance instanceof WorkerHost)) return [];
      try {
        return [instance.worker];
      } catch {
        // Failed bootstrap can leave a WorkerHost without a registered worker.
        return [];
      }
    });
    const workerResults = await Promise.allSettled(
      [...new Set(workers)].map((worker) => worker.close())
    );
    if (workerResults.some((result) => result.status === 'rejected')) {
      this.logger.error('Could not drain every queue worker');
    }
  }

  async onApplicationShutdown() {
    await shutdownTelemetry();
  }
}

@Global()
@Module({ imports: [DiscoveryModule], providers: [RuntimeLifecycleService] })
export class RuntimeLifecycleModule {}
