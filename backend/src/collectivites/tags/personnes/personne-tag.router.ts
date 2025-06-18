import { PersonneTagService } from '@/backend/collectivites/tags/personnes/personne-tag.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { PermissionOperationEnum } from '../../../users/authorizations/permission-operation.enum';
import { PermissionService } from '../../../users/authorizations/permission.service';

@Injectable()
export class PersonneTagRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: PersonneTagService,
    private readonly permissionService: PermissionService
  ) {}

  router = this.trpc.router({
    convertToUser: this.trpc.authedProcedure
      .input(
        z.object({
          userId: z.string(),
          tagIds: z.number().array(),
          collectiviteId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return this.service.convertTagsToUser(
          input.userId,
          input.tagIds,
          input.collectiviteId,
          ctx.user
        );
      }),

    list: this.trpc.authedProcedure
      .input(
        z.object({
          collectiviteId: z.number(),
          tagIds: z.number().array().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        // Vérification des droits
        await this.permissionService.isAllowed(
          ctx.user,
          PermissionOperationEnum['COLLECTIVITES.TAGS.LECTURE'],
          ResourceType.COLLECTIVITE,
          input.collectiviteId
        );

        return this.service.listPersonneTags(
          input.collectiviteId,
          input.tagIds ?? []
        );
      }),
  });
}
