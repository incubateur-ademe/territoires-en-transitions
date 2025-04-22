import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class UsersRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: UsersService
  ) {}

  router = this.trpc.router({
    get: this.trpc.authedProcedure
      .input(this.service.getInputSchema)
      .query(({ input, ctx }) =>
        this.service.getUserWithPermissions(input, ctx.user)
      ),

    getAll: this.trpc.authedProcedure
      .input(this.service.getAllInputSchema)
      .query(({ input, ctx }) =>
        this.service.usersInfoByEmail(input, ctx.user)
      ),
  });
}
