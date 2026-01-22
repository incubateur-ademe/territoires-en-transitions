import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import z from 'zod';
import { GetLabellisationService } from './get-labellisation.service';

export const inputSchema = z.object({
  collectiviteId: z.number(),
  referentielId: referentielIdEnumSchema,
});

@Injectable()
export class GetLabellisationRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly permissions: PermissionService,
    private readonly labellisations: GetLabellisationService
  ) {}

  router = this.trpc.router({
    getParcours: this.trpc.authedProcedure
      .input(inputSchema)
      .query(
        async ({ input: { collectiviteId, referentielId }, ctx: { user } }) => {
          await this.permissions.isAllowed(
            user,
            'collectivites.read',
            ResourceType.COLLECTIVITE,
            collectiviteId
          );

          return this.labellisations.getParcoursLabellisation({
            collectiviteId,
            referentielId,
          });
        }
      ),
  });
}
