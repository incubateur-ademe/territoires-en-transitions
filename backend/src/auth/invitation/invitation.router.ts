import { Injectable } from '@nestjs/common';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { InvitationService } from '@/backend/auth/invitation/invitation.service';
import { z } from 'zod';
import { invitationRequestSchema } from '@/backend/auth/invitation/invitation.request';

@Injectable()
export class InvitationRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: InvitationService
  ) {}

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(invitationRequestSchema)
      .mutation(({ ctx, input }) => {
        return this.service.createInvitation(input, ctx.user);
      }),
    consume: this.trpc.authedProcedure
      .input(z.object({ invitationId: z.string() }))
      .mutation(({ ctx, input }) => {
        return this.service.consumeInvitation(input.invitationId, ctx.user);
      }),
  });
}
