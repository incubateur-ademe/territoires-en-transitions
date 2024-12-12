import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { TrpcService } from '../trpc/trpc.service';
import {
  listRequestSchema,
  PersonnesService,
} from './services/personnes.service';
import { PermissionService } from '../auth/gestion-des-droits/permission.service';
import { Authorization } from '../auth/gestion-des-droits/authorization.enum';
import { ResourceType } from '../auth/gestion-des-droits/resource-type.enum';
import CollectivitesService from '../collectivites/services/collectivites.service';

const inputSchema = listRequestSchema;

@Injectable()
export class PersonnesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly permission: PermissionService,
    private readonly service: PersonnesService,
    private readonly collectivite: CollectivitesService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(inputSchema)
      .query(async ({ input, ctx }) => {
        const collectivitePrivate = await this.collectivite.isPrivate(
          input.collectiviteId
        );
        const authorized = await this.permission.hasTheRightTo(
          ctx.user,
          collectivitePrivate
            ? Authorization.COLLECTIVITES_CONTENT_LECTURE
            : Authorization.COLLECTIVITES_CONTENT_VISITE,
          ResourceType.COLLECTIVITE,
          input.collectiviteId,
          true
        );

        if (!authorized) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User is not authorized to access this collectivité',
          });
        }

        return this.service.list(input);
      }),
  });
}
