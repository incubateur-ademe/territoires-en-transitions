import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/domain/users';
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
    private readonly service: PersonnesService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(inputSchema)
      .query(async ({ input, ctx }) => {
        await Promise.all(
          input.collectiviteIds.map(async (collectiviteId) => {
            return this.permission.isAllowed(
              ctx.user,
              'collectivites.read',
              ResourceType.COLLECTIVITE,
              collectiviteId
            );
          })
        );
        return this.service.list(input);
      }),
  });
}
