import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import CollectivitesService from '../collectivites/services/collectivites.service';
import { TrpcService } from '../utils/trpc/trpc.service';
import {
  listRequestSchema,
  PersonnesService,
} from './services/personnes.service';

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
        const authorized = await this.permission.isAllowed(
          ctx.user,
          collectivitePrivate
            ? PermissionOperationEnum['COLLECTIVITES.LECTURE']
            : PermissionOperationEnum['COLLECTIVITES.VISITE'],
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
