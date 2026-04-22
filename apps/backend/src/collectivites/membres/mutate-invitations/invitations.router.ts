import { Injectable } from '@nestjs/common';
import {
  getScopeOrThrow,
  ScopeFactory,
} from '@tet/backend/authorizations/scope-factory.service';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { z } from 'zod';
import { PermissionService } from '../../../users/authorizations/permission.service';
import { listPendingInvitationsInputSchema } from '../list-pending-invitations/list-pending-invitations.input';
import { ListPendingInvitationsService } from '../list-pending-invitations/list-pending-invitations.service';
import { createInvitationInputSchema } from './create-invitation.input';
import { InvitationService } from './invitation.service';

@Injectable()
export class InvitationsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: InvitationService,
    private readonly permissionService: PermissionService,
    private readonly listPendingInvitationsService: ListPendingInvitationsService,
    private readonly scopeFactory: ScopeFactory
  ) {}

  router = this.trpc.router({
    listPendings: this.trpc.authedProcedure
      .input(listPendingInvitationsInputSchema)
      .query(({ input, ctx }) =>
        this.listPendingInvitationsService.list(input, { user: ctx.user })
      ),

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

        const scope = getScopeOrThrow(
          await this.scopeFactory.fromAuthenticatedUser(ctx.user)
        );
        return this.service.createInvitation(input, scope);
      }),

    consume: this.trpc.authedProcedure
      .input(z.object({ invitationId: z.string() }))
      .mutation(({ ctx, input }) => {
        return this.service.consumeInvitation(input.invitationId, ctx.user);
      }),

    deletePending: this.trpc.authedProcedure
      .input(
        z.object({
          email: z.email({ pattern: z.regexes.unicodeEmail }),
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
