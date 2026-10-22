import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listContactsErrorConfig } from './list-contacts.errors';
import { listContactsInputSchema } from './list-contacts.input';
import { ListContactsService } from './list-contacts.service';

@Injectable()
export class ListContactsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listContactsService: ListContactsService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listContactsErrorConfig
  );

  router = this.trpc.router({
    listContacts: this.trpc.authedProcedure
      .input(listContactsInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.listContactsService.listContacts(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
