import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { upsertBannerInputSchema } from '@tet/domain/utils';
import { bannerErrorConfig } from './banner.error';
import { BannerService } from './banner.service';

const getResultDataOrThrowError = createTrpcErrorHandler(bannerErrorConfig);

@Injectable()
export class BannerRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly bannerService: BannerService
  ) {}

  router = this.trpc.router({
    /**
     * Returns the singleton banner (or null if none). Accessible to any
     * authenticated user; `modifiedByNom` is gated by the
     * `utils.banner.mutate` permission — non-support callers see a
     * sentinel instead of the modifier's name.
     */
    get: this.trpc.authedProcedure.query(async ({ ctx: { user } }) => {
      return this.bannerService.get(user);
    }),

    /**
     * Creates or updates the singleton banner. Requires the
     * `utils.banner.mutate` permission (granted to PlatformRole.SUPER_ADMIN
     * — i.e., support staff in super-admin mode). The HTML content is
     * sanitized server-side before persisting.
     */
    upsert: this.trpc.authedProcedure
      .input(upsertBannerInputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.bannerService.upsert(input, user);
        return getResultDataOrThrowError(result);
      }),
  });
}
