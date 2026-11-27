import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getSiteCollectiviteInputSchema } from './get-site-collectivite/get-site-collectivite.input';
import { siteCollectiviteSchema } from './get-site-collectivite/get-site-collectivite.output';
import { GetSiteCollectiviteService } from './get-site-collectivite/get-site-collectivite.service';
import { siteStatsHeroSectionSchema } from './get-site-stats-hero-section/get-site-stats-hero-section.output';
import { GetSiteStatsHeroSectionService } from './get-site-stats-hero-section/get-site-stats-hero-section.service';
import { listSiteCarteOutputSchema } from './list-site-carte/list-site-carte.output';
import { ListSiteCarteService } from './list-site-carte/list-site-carte.service';
import { searchSiteCollectivitesInputSchema } from './search-site-collectivites/search-site-collectivites.input';
import { siteCollectiviteSearchResultSchema } from './search-site-collectivites/search-site-collectivites.output';
import { SearchSiteCollectivitesService } from './search-site-collectivites/search-site-collectivites.service';

/**
 * Nombre d'appels à `listCarte` autorisés par IP et par fenêtre.
 *
 * La réponse pèse ~2 Mo (contours GeoJSON) et la procédure est publique : large
 * pour des visiteurs derrière une même IP, étroit pour un robot qui boucle.
 */
export const CARTE_RATE_LIMIT = {
  name: 'site-carte',
  limit: 30,
  ttl: 60_000,
} as const;

/** Le site met la réponse en cache une heure : au-delà, c'est un robot. */
export const STATS_HERO_SECTION_RATE_LIMIT = {
  name: 'site-stats-hero-section',
  limit: 30,
  ttl: 60_000,
} as const;

/**
 * Lectures publiques (sans session) du site vitrine : recherche, fiche et
 * carte des collectivités, chiffres clés. Ne renvoie que des données déjà publiées sur le site.
 */
@Injectable()
export class SiteRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly searchSiteCollectivitesService: SearchSiteCollectivitesService,
    private readonly getSiteCollectiviteService: GetSiteCollectiviteService,
    private readonly listSiteCarteService: ListSiteCarteService,
    private readonly getSiteStatsHeroSectionService: GetSiteStatsHeroSectionService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    searchCollectivites: this.trpc.publicProcedure
      .input(searchSiteCollectivitesInputSchema)
      .output(siteCollectiviteSearchResultSchema.array())
      .query(async ({ input }) => {
        const result = await this.searchSiteCollectivitesService.search(input);
        return this.getResultDataOrThrowError(result);
      }),

    getCollectivite: this.trpc.publicProcedure
      .input(getSiteCollectiviteInputSchema)
      .output(siteCollectiviteSchema.nullable())
      .query(async ({ input }) => {
        const result = await this.getSiteCollectiviteService.get(input);
        return this.getResultDataOrThrowError(result);
      }),

    listCarte: this.trpc.publicProcedure
      .use(this.trpc.rateLimit(CARTE_RATE_LIMIT))
      .output(listSiteCarteOutputSchema)
      .query(async () => {
        const result = await this.listSiteCarteService.list();
        return this.getResultDataOrThrowError(result);
      }),

    getStatsHeroSection: this.trpc.publicProcedure
      .use(this.trpc.rateLimit(STATS_HERO_SECTION_RATE_LIMIT))
      .output(siteStatsHeroSectionSchema.nullable())
      .query(async () => {
        const result = await this.getSiteStatsHeroSectionService.get();
        return this.getResultDataOrThrowError(result);
      }),
  });
}
