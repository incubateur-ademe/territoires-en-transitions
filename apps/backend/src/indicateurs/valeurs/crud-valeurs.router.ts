import { Injectable } from '@nestjs/common';
import { collectiviteIdInputSchemaPartial } from '@tet/backend/collectivites/collectivite-id.input';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ResourceType } from '@tet/domain/users';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import IndicateurValeursService from './crud-valeurs.service';
import { deleteValeurIndicateurSchema } from './delete-valeur-indicateur.request';
import { getMoyenneCollectivitesRequestSchema } from './get-moyenne-collectivites.request';
import { getValeursReferenceRequestSchema } from './get-valeurs-reference.request';
import { listIndicateurValeursInputSchema } from './list-indicateur-valeurs.input';
import { upsertValeurIndicateurSchema } from './upsert-valeur-indicateur.request';
import { upsertGridValeursInputSchema } from './upsert-grid-valeurs.input';
import { upsertGridValeursErrorConfig } from './upsert-grid-valeurs.errors';
import { UpsertGridValeursService } from './upsert-grid-valeurs.service';
import ValeursMoyenneService from './valeurs-moyenne.service';
import ValeursReferenceService from './valeurs-reference.service';

@Injectable()
export class IndicateurValeursRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly permissionService: PermissionService,
    private readonly service: IndicateurValeursService,
    private readonly upsertGridValeursService: UpsertGridValeursService,
    private readonly valeursMoyenne: ValeursMoyenneService,
    private readonly valeursReference: ValeursReferenceService
  ) {}

  private readonly getUpsertGridValeursResultOrThrow = createTrpcErrorHandler(
    upsertGridValeursErrorConfig
  );

  router = this.trpc.router({
    list: this.trpc.authedOrServiceRoleProcedure
      .input(listIndicateurValeursInputSchema)
      .query(({ ctx, input }) => {
        return this.service.listIndicateurValeurs(input, { user: ctx.user });
      }),
    upsert: this.trpc.authedProcedure
      .input(upsertValeurIndicateurSchema)
      .mutation(({ input, ctx }) => {
        return this.service.upsertValeur(input, ctx.user);
      }),
    upsertMany: this.trpc.authedProcedure
      .input(upsertGridValeursInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.upsertGridValeursService.upsertGridValeurs(
          input,
          { user: ctx.user }
        );
        return this.getUpsertGridValeursResultOrThrow(result);
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
        await this.permissionService.assertAllowed(
          ctx.user,
          'indicateurs.valeurs.read',
          ResourceType.COLLECTIVITE,
          { collectiviteId: input.collectiviteId }
        );

        return this.valeursReference.getValeursReference(input);
      }),
    recompute: this.trpc.serviceRoleProcedure
      .input(collectiviteIdInputSchemaPartial)
      .mutation(({ ctx, input }) => {
        return this.service.recomputeAllCalculatedIndicateurValeurs(
          input.collectiviteId,
          ctx.user
        );
      }),
  });
}
