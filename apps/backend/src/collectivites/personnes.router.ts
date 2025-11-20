import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { Injectable } from '@nestjs/common';
import { PermissionOperationEnum } from '@tet/domain/users';
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
        // It's ok to load tags from all collectivites
        await this.permission.isAllowed(
          ctx.user,
          PermissionOperationEnum['COLLECTIVITES.READ_PUBLIC'],
          ResourceType.PLATEFORME,
          null
        );

        return this.service.list(input);
      }),
  });
}
