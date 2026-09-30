import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import { getErrorMessage } from '@tet/domain/utils';
import { sql } from 'drizzle-orm';
import { GetSiteCollectiviteInput } from './get-site-collectivite.input';
import { SiteCollectivite } from './get-site-collectivite.output';

/** Indicateurs d'émissions de GES (CITEPA) affichés sur la fiche. */
const IDENTIFIANTS_GES = [
  'cae_1.a',
  'cae_1.c',
  'cae_1.d',
  'cae_1.e',
  'cae_1.f',
  'cae_1.g',
  'cae_1.h',
  'cae_1.i',
  'cae_1.j',
];

@Injectable()
export class GetSiteCollectiviteService {
  private readonly logger = new Logger(GetSiteCollectiviteService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Données publiques d'une collectivité pour sa fiche sur le site :
   * dernières labellisations (vue matérialisée `site_labellisation`),
   * historique de labellisation et indicateurs GES / artificialisation.
   */
  async get({
    codeSirenInsee,
  }: GetSiteCollectiviteInput): Promise<
    Result<SiteCollectivite | null, CommonError>
  > {
    try {
      const result = await this.databaseService.db
        .execute<SiteCollectivite>(sql`
          select
            sl.collectivite_id as "collectiviteId",
            sl.nom,
            sl.type_collectivite as "typeCollectivite",
            sl.nature_collectivite as "natureCollectivite",
            sl.code_siren_insee as "codeSirenInsee",
            sl.region_name as "regionName",
            sl.region_code as "regionCode",
            sl.departement_name as "departementName",
            sl.departement_code as "departementCode",
            sl.population_totale as "populationTotale",
            sl.active,
            sl.labellisee,
            sl.cae_etoiles as "caeEtoiles",
            sl.eci_etoiles as "eciEtoiles",
            coalesce(
              (
                select jsonb_agg(
                  jsonb_build_object(
                    'id', l.id,
                    'referentiel', l.referentiel,
                    'annee', l.annee,
                    'etoiles', l.etoiles,
                    'scoreRealise', l.score_realise
                  )
                  order by l.obtenue_le
                )
                from labellisation l
                where l.collectivite_id = sl.collectivite_id
              ),
              '[]'::jsonb
            ) as labellisations,
            (
              select jsonb_agg(
                jsonb_build_object(
                  'dateValeur', iv.date_valeur,
                  'resultat', iv.resultat,
                  'identifiant', def.identifiant_referentiel,
                  'source', src.libelle
                )
              )
              from indicateur_valeur iv
              join indicateur_definition def on def.id = iv.indicateur_id
              join indicateur_source_metadonnee ism on ism.id = iv.metadonnee_id
              join indicateur_source src on src.id = ism.source_id
              where iv.collectivite_id = sl.collectivite_id
                and iv.periodicite = 'annuelle'
                and iv.resultat is not null
                and src.id = 'citepa'
                and def.identifiant_referentiel in ${IDENTIFIANTS_GES}
            ) as "indicateursGazEffetSerre",
            (
              select to_jsonb(ia) - 'collectivite_id'
              from indicateur_artificialisation ia
              where ia.collectivite_id = sl.collectivite_id
            ) as "indicateurArtificialisation"
          from site_labellisation sl
          where sl.code_siren_insee = ${codeSirenInsee}
          limit 1
        `);

      return success(result.rows[0] ?? null);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la lecture de la collectivité ${codeSirenInsee} pour le site: ${getErrorMessage(
          error
        )}`
      );
      return failure(CommonErrorEnum.DATABASE_ERROR);
    }
  }
}
