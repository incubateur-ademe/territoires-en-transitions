import { ApikeysService } from '@/backend/auth/apikeys/apikeys.service';
import { deleteApiKeyRequestSchema } from '@/backend/auth/apikeys/delete-api-key.request';
import { generateApiKeyRequestSchema } from '@/backend/auth/apikeys/generate-api-key.request';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ApikeysRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly apikeysService: ApikeysService
  ) {}

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(generateApiKeyRequestSchema)
      .mutation(({ input, ctx }) => {
        return this.apikeysService.create(ctx.user, input);
      }),
    list: this.trpc.authedProcedure.query(({ ctx }) => {
      return this.apikeysService.list(ctx.user);
    }),
    delete: this.trpc.authedProcedure
      .input(deleteApiKeyRequestSchema)
      .mutation(({ input, ctx }) => {
        return this.apikeysService.delete(ctx.user, input.clientId);
      }),
  });
}
