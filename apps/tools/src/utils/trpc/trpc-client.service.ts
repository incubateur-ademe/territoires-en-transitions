import type { AppRouter } from '@/backend/utils/trpc/trpc.router';
import { Injectable, Logger } from '@nestjs/common';
import { createTRPCClient, httpBatchLink, TRPCClient } from '@trpc/client';
import ConfigurationService from '../../config/configuration.service';

@Injectable()
export class TrpcClientService {
  private readonly logger = new Logger(TrpcClientService.name);
  private readonly client: TRPCClient<AppRouter>;

  constructor(private readonly configurationService: ConfigurationService) {
    const apiToken = this.configurationService.get('TET_API_TOKEN');
    const apiUrl = this.configurationService.get('TET_API_URL');
    this.client = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${apiUrl}/trpc`,
          // You can pass any HTTP headers you wish here
          async headers() {
            return {
              authorization: `Bearer ${apiToken}`,
            };
          },
        }),
      ],
    });
  }

  getClient() {
    return this.client;
  }
}
