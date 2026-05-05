import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { annexeSchema } from '@tet/domain/collectivites';
import { addAnnexeInputSchema } from './add-annexe.input';
import { AddAnnexeService } from './add-annexe.service';

@Injectable()
export class AddAnnexeRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly addAnnexeService: AddAnnexeService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    addAnnexe: this.trpc.authedProcedure
      .input(addAnnexeInputSchema)
      .output(annexeSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.addAnnexeService.addAnnexe(input, user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
