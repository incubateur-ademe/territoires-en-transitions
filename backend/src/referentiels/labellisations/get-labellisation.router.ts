import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { PermissionOperation, ResourceType } from '@/domain/auth';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import { referentielIdEnumSchema } from '../index-domain';
import { LabellisationService } from './labellisation.service';

export const inputSchema = z.object({
  collectiviteId: z.number(),
  referentielId: referentielIdEnumSchema,
});

@Injectable()
export class GetLabellisationRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly permissions: PermissionService,
    private readonly labellisations: LabellisationService
  ) {}

  router = this.trpc.router({
    getParcours: this.trpc.authedProcedure
      .input(inputSchema)
      .query(
        async ({ input: { collectiviteId, referentielId }, ctx: { user } }) => {
          await this.permissions.isAllowed(
            user,
            PermissionOperation.COLLECTIVITES_VISITE,
            ResourceType.COLLECTIVITE,
            collectiviteId
          );

          return this.labellisations.getParcoursLabellisation({
            collectiviteId,
            referentielId,
            user,
          });
        }
      ),
  });
}
