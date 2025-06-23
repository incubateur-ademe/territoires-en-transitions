import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import {
  PermissionOperationEnum,
  ResourceType,
} from '@/backend/auth/index-domain';
import { partialCollectiviteRequestSchema } from '@/backend/collectivites/collectivite.request';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { deleteValeurIndicateurSchema } from '../shared/models/delete-valeur-indicateur.request';
import { getIndicateursValeursInputSchema } from '../shared/models/get-indicateurs.input';
import { upsertValeurIndicateurSchema } from '../shared/models/upsert-valeur-indicateur.request';
import IndicateurValeursService from './crud-valeurs.service';
import { getMoyenneCollectivitesRequestSchema } from './get-moyenne-collectivites.request';
import { getValeursReferenceRequestSchema } from './get-valeurs-reference.request';
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
    list: this.trpc.authedProcedure
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
          PermissionOperationEnum['INDICATEURS.VISITE'],
          ResourceType.COLLECTIVITE,
          input.collectiviteId
        );

        return this.valeursReference.getValeursReference(input);
      }),
    recompute: this.trpc.authedProcedure
      .input(partialCollectiviteRequestSchema)
      .query(({ ctx, input }) => {
        return this.service.recomputeAllCalculatedIndicateurValeurs(
          input.collectiviteId,
          ctx.user
        );
      }),
  });
}
