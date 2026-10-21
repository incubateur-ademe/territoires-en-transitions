import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { success } from '@tet/backend/utils/result.type';
import { listActionTextOverridesOutputSchema } from '@tet/domain/referentiels';
import { RenderActionTextsService } from '../action-definitions/render-action-texts.service';
import { listActionTextOverridesErrorConfig } from './list-action-text-overrides.errors';
import { listActionTextOverridesInputSchema } from './list-action-text-overrides.input';

@Injectable()
export class ListActionTextOverridesRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listActionTextOverridesErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly renderActionTextsService: RenderActionTextsService
  ) {}

  router = this.trpc.router({
    // Publique, comme `listActionDefinitions` : la clé décrit un profil de
    // collectivité (« DOM »), pas une collectivité, et les textes sont publics
    listActionTextOverrides: this.trpc.publicProcedure
      .input(listActionTextOverridesInputSchema)
      .output(listActionTextOverridesOutputSchema)
      .query(async ({ input: { referentielId, textVariantKey } }) => {
        const result =
          await this.renderActionTextsService.getTextOverridesForVariant(
            referentielId,
            textVariantKey
          );
        return this.getResultDataOrThrowError(
          result.success ? success({ ...result.data, textVariantKey }) : result
        );
      }),
  });
}
