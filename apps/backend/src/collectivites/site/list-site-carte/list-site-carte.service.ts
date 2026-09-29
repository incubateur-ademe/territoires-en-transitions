import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import { getErrorMessage } from '@tet/domain/utils';
import { sql } from 'drizzle-orm';
import {
  ListSiteCarteOutput,
  SiteCarteCollectivite,
  SiteCarteRegion,
} from './list-site-carte.output';

@Injectable()
export class ListSiteCarteService {
  private readonly logger = new Logger(ListSiteCarteService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Collectivités engagées ou actives, et régions, avec leur contour GeoJSON,
   * pour la carte de France du site public.
   */
  async list(): Promise<Result<ListSiteCarteOutput, CommonError>> {
    try {
      const [collectivites, regions] = await Promise.all([
        this.databaseService.db.execute<SiteCarteCollectivite>(sql`
          select
            sl.collectivite_id as "collectiviteId",
            sl.nom,
            sl.type_collectivite as "typeCollectivite",
            sl.nature_collectivite as "natureCollectivite",
            sl.code_siren_insee as "codeSirenInsee",
            sl.region_name as "regionName",
            sl.departement_name as "departementName",
            sl.population_totale as "populationTotale",
            sl.cot,
            sl.engagee,
            sl.labellisee,
            sl.cae_etoiles as "caeEtoiles",
            sl.eci_etoiles as "eciEtoiles",
            (
              select coalesce(cg.geojson, eg.geojson)
              from collectivite c
              left join stats.epci_geojson eg on eg.siren = c.siren
              left join stats.commune_geojson cg on cg.insee = c.commune_code
              where c.id = sl.collectivite_id
            ) as geojson
          from site_labellisation sl
          where sl.engagee or sl.active
        `),
        this.databaseService.db.execute<SiteCarteRegion>(sql`
          select insee, libelle, geojson from stats.region_geojson
        `),
      ]);

      return success({
        collectivites: collectivites.rows,
        regions: regions.rows,
      });
    } catch (error) {
      this.logger.error(
        `Erreur lors de la lecture de la carte des collectivités: ${getErrorMessage(
          error
        )}`
      );
      return failure(CommonErrorEnum.DATABASE_ERROR);
    }
  }
}
