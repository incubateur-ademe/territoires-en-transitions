import { Injectable } from '@nestjs/common';
import { TrpcClientService } from '../utils/trpc/trpc-client.service';

@Injectable()
export class CronIndicateurFormulaReconciliationsService {
  private readonly trpcClient = this.trpcClientService.getClient();

  constructor(private readonly trpcClientService: TrpcClientService) {}

  async drain() {
    const result =
      await this.trpcClient.indicateurs.formulaReconciliations.drain.mutate({});
    if (result.failedCount > 0) {
      throw new Error(
        `${result.failedCount} indicateur formula reconciliation(s) failed; ${result.remainingCount} pending`
      );
    }
    return result;
  }
}
