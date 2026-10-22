import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ReferentsPcaetPermissionsService } from '../referents-pcaet-permissions.service';
import { getReferentsAccessInputSchema } from './get-referents-access.input';

/** Ce que la navigation et la page lisent pour s'afficher ou non. */
@Injectable()
export class GetReferentsAccessRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly permissionsService: ReferentsPcaetPermissionsService
  ) {}

  router = this.trpc.router({
    getAccess: this.trpc.authedProcedure
      .input(getReferentsAccessInputSchema)
      .query(({ input, ctx }) =>
        this.permissionsService.getAccess(input.collectiviteId, {
          user: ctx.user,
        })
      ),
  });
}
