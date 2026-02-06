import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { UserPreferencesErrorConfig } from './user-preferences.errors';
import {
  updateUserPreferencesFlatInputSchema,
  updateUserPreferencesInputSchema,
} from './user-preferences.repository';
import { UserPreferencesService } from './user-preferences.service';

@Injectable()
export class UserPreferencesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly userPreferencesService: UserPreferencesService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    UserPreferencesErrorConfig
  );

  router = this.trpc.router({
    get: this.trpc.authedProcedure.query(async ({ ctx: { user } }) =>
      this.getResultDataOrThrowError(
        await this.userPreferencesService.getUserPreferences(user.id)
      )
    ),

    update: this.trpc.authedProcedure
      .input(updateUserPreferencesInputSchema)
      .mutation(async ({ input, ctx: { user } }) =>
        this.getResultDataOrThrowError(
          await this.userPreferencesService.updateUserPreferences(user, input)
        )
      ),

    updateFlat: this.trpc.authedProcedure
      .input(updateUserPreferencesFlatInputSchema)
      .mutation(async ({ input, ctx: { user } }) =>
        this.getResultDataOrThrowError(
          await this.userPreferencesService.updateUserPreferencesFlat(
            user,
            input
          )
        )
      ),
  });
}
