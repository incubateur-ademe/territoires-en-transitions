import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import { getErrorMessage } from '@tet/domain/utils';
import { sql } from 'drizzle-orm';
import { SearchSiteCollectivitesInput } from './search-site-collectivites.input';
import { SiteCollectiviteSearchResult } from './search-site-collectivites.output';
import { buildPrefixTsquery } from './search-site-collectivites.rules';

/** Nombre de collectivités proposées tant que rien n'est saisi. */
const DEFAULT_LIMIT = 10;

/** Borne une recherche trop large (ex. une seule lettre). */
const SEARCH_LIMIT = 100;

/** Code INSEE de Strasbourg (commune), doublon de l'Eurométropole sur le site. */
const CODE_STRASBOURG_COMMUNE = '67482';

@Injectable()
export class SearchSiteCollectivitesService {
  private readonly logger = new Logger(SearchSiteCollectivitesService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Recherche plein texte des collectivités pour le site public, sur la vue
   * matérialisée `site_labellisation` (index GIN sur `to_tsvector('french', nom)`).
   */
  async search({
    search,
  }: SearchSiteCollectivitesInput): Promise<
    Result<SiteCollectiviteSearchResult[], CommonError>
  > {
    const tsquery = buildPrefixTsquery(search);

    try {
      const result = await this.databaseService.db
        .execute<SiteCollectiviteSearchResult>(sql`
          select code_siren_insee as "codeSirenInsee", nom
          from site_labellisation
          where code_siren_insee <> ${CODE_STRASBOURG_COMMUNE}
          ${
            tsquery
              ? sql`and to_tsvector('french', nom) @@ to_tsquery('french', ${tsquery})`
              : sql``
          }
          order by nom
          limit ${tsquery ? SEARCH_LIMIT : DEFAULT_LIMIT}
        `);

      return success(result.rows);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la recherche de collectivités "${search}": ${getErrorMessage(
          error
        )}`
      );
      return failure(CommonErrorEnum.DATABASE_ERROR);
    }
  }
}
