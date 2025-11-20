import { Injectable } from '@nestjs/common';
import { collectiviteIdInputSchemaPartial } from '@tet/backend/collectivites/collectivite-id.input';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import IndicateurValeursService from './crud-valeurs.service';
import { deleteValeurIndicateurSchema } from './delete-valeur-indicateur.request';
import { getIndicateursValeursInputSchema } from './get-indicateur-valeurs.input';
import { getMoyenneCollectivitesRequestSchema } from './get-moyenne-collectivites.request';
import { getValeursReferenceRequestSchema } from './get-valeurs-reference.request';
import { upsertValeurIndicateurSchema } from './upsert-valeur-indicateur.request';
import ValeursMoyenneService from './valeurs-moyenne.service';
import ValeursReferenceService from './valeurs-reference.service';

@Injectable()
export class IndicateurValeursRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly permissionService: PermissionService,
    private readonly service: IndicateurValeursService,
    private readonly valeursMoyenne: ValeursMoyenneService,
    private readonly valeursReference: ValeursReferenceService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedOrServiceRoleProcedure
      .input(getIndicateursValeursInputSchema)
      .query(({ ctx, input }) => {
        return this.service.getIndicateurValeursGroupees(input, ctx.user);
      }),
    upsert: this.trpc.authedProcedure
      .input(upsertValeurIndicateurSchema)
      .mutation(({ input, ctx }) => {
        return this.service.upsertValeur(input, ctx.user);
      }),
    delete: this.trpc.authedProcedure
      .input(deleteValeurIndicateurSchema)
      .mutation(({ input, ctx }) => {
        return this.service.deleteValeurIndicateur(input, ctx.user);
      }),
    average: this.trpc.authedProcedure
      .input(getMoyenneCollectivitesRequestSchema)
      .query(({ ctx, input }) => {
        return this.valeursMoyenne.getMoyenneCollectivites(input, ctx.user);
      }),
    reference: this.trpc.authedProcedure
      .input(getValeursReferenceRequestSchema)
      .query(async ({ ctx, input }) => {
        // Vérifie les droits
        await this.permissionService.isAllowed(
          ctx.user,
          'indicateurs.valeurs.read_public',
          ResourceType.COLLECTIVITE,
          input.collectiviteId
        );

        return this.valeursReference.getValeursReference(input);
      }),
    recompute: this.trpc.authedProcedure
      .input(collectiviteIdInputSchemaPartial)
      .query(({ ctx, input }) => {
        return this.service.recomputeAllCalculatedIndicateurValeurs(
          input.collectiviteId,
          ctx.user
        );
      }),
  });
}
