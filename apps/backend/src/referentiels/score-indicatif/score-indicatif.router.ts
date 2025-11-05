import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { PermissionOperationEnum } from '@/domain/users';
import { Injectable } from '@nestjs/common';
import { getScoreIndicatifRequestSchema } from './get-score-indicatif.request';
import { getValeursUtilisablesRequestSchema } from './get-valeurs-utilisables.request';
import { getValeursUtiliseesRequestSchema } from './get-valeurs-utilisees.request';
import { ScoreIndicatifService } from './score-indicatif.service';
import { setValeursUtiliseesRequestSchema } from './set-valeurs-utilisees.request';

@Injectable()
export class ScoreIndicatifRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ScoreIndicatifService,
    private readonly permissionService: PermissionService
  ) {}

  router = this.trpc.router({
    getValeursUtilisees: this.trpc.authedProcedure
      .input(getValeursUtiliseesRequestSchema)
      .query(async ({ ctx, input }) => {
        await this.permissionService.isAllowed(
          ctx.user,
          'indicateurs.definitions.read',
          ResourceType.COLLECTIVITE,
          input.collectiviteId
        );
        return this.service.getValeursUtiliseesParActionId(input);
      }),

    getValeursUtilisables: this.trpc.authedProcedure
      .input(getValeursUtilisablesRequestSchema)
      .query(async ({ ctx, input }) => {
        return this.service.getValeursUtilisables(input, ctx.user);
      }),

    setValeursUtilisees: this.trpc.authedProcedure
      .input(setValeursUtiliseesRequestSchema)
      .mutation(async ({ ctx, input }) => {
        await this.permissionService.isAllowed(
          ctx.user,
          PermissionOperationEnum['REFERENTIELS.MUTATE'],
          ResourceType.COLLECTIVITE,
          input.collectiviteId
        );
        return this.service.setValeursUtilisees(input);
      }),

    getScoreIndicatif: this.trpc.authedProcedure
      .input(getScoreIndicatifRequestSchema)
      .query(async ({ ctx, input }) => {
        await this.permissionService.isAllowed(
          ctx.user,
          PermissionOperationEnum['COLLECTIVITES.READ'],
          ResourceType.COLLECTIVITE,
          input.collectiviteId
        );
        return this.service.getScoreIndicatif(input);
      }),
  });
}
