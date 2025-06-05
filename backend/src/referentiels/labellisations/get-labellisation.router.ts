import { PermissionService } from '@/backend/users/authorizations/permission.service';
import {
  PermissionOperationEnum,
  ResourceType,
} from '@/backend/users/index-domain';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import { referentielIdEnumSchema } from '../index-domain';
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
            PermissionOperationEnum['COLLECTIVITES.VISITE'],
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
