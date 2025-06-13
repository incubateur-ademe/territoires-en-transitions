import { ApikeysService } from '@/backend/users/apikeys/apikeys.service';
import { deleteApiKeyRequestSchema } from '@/backend/users/apikeys/delete-api-key.request';
import { generateApiKeyRequestSchema } from '@/backend/users/apikeys/generate-api-key.request';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ApikeysRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly apikeysService: ApikeysService
  ) {}

  router = this.trpc.router({
    create: this.trpc.authedOrServiceRoleProcedure
      .input(generateApiKeyRequestSchema)
      .mutation(({ input, ctx }) => {
        return this.apikeysService.create(ctx.user, input);
      }),

    list: this.trpc.authedOrServiceRoleProcedure.query(({ ctx }) => {
      return this.apikeysService.list(ctx.user);
    }),

    delete: this.trpc.authedOrServiceRoleProcedure
      .input(deleteApiKeyRequestSchema)
      .mutation(({ input, ctx }) => {
        return this.apikeysService.delete(ctx.user, input.clientId);
      }),
  });
}
