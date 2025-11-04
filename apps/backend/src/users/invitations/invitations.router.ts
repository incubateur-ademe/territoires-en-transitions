import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { createInvitationInputSchema } from '@/backend/users/invitations/create-invitation.input';
import { InvitationService } from '@/backend/users/invitations/invitation.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { PermissionService } from '../authorizations/permission.service';

@Injectable()
export class InvitationsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: InvitationService,
    private readonly permissionService: PermissionService
  ) {}

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(createInvitationInputSchema)
      .mutation(async ({ ctx, input }) => {
        // Vérifie que la personne qui invite a les droits
        await this.permissionService.isAllowed(
          ctx.user,
          PermissionOperationEnum['COLLECTIVITES.MEMBRES.MUTATE'],
          ResourceType.COLLECTIVITE,
          input.collectiviteId
        );

        return this.service.createInvitation(input, ctx.user);
      }),

    consume: this.trpc.authedProcedure
      .input(z.object({ invitationId: z.string() }))
      .mutation(({ ctx, input }) => {
        return this.service.consumeInvitation(input.invitationId, ctx.user);
      }),

    deletePending: this.trpc.authedProcedure
      .input(
        z.object({
          email: z.email(),
          collectiviteId: z.int().positive(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Vérifie que la personne qui supprime l'invitation a les droits
        await this.permissionService.isAllowed(
          ctx.user,
          PermissionOperationEnum['COLLECTIVITES.MEMBRES.MUTATE'],
          ResourceType.COLLECTIVITE,
          input.collectiviteId
        );

        return this.service.deletePendingInvitation(
          input.email,
          input.collectiviteId
        );
      }),
  });
}
