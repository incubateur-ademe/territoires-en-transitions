import { Injectable, Logger } from '@nestjs/common';
import {
  and,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  sql,
  SQLWrapper,
} from 'drizzle-orm';
import CollectivitesService from '../../collectivites/services/collectivites.service';
import DatabaseService from '../../common/services/database.service';
import { GetIndicateursValeursOptions } from '../models/getIndicateursValeursOptions.models';
import {
  CreateIndicateurValeurType,
  indicateurDefinitionTable,
  indicateurSourceMetadonneeTable,
  indicateurValeurTable,
} from '../models/indicateur.models';
import IndicateurSourcesService from './indicateurSources.service';

@Injectable()
export default class IndicateursService {
  private readonly logger = new Logger(IndicateursService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly indicateurSourcesService: IndicateurSourcesService,
    private readonly collectivitesService: CollectivitesService,
  ) {}

  /**
   * Récupère les valeurs d'indicateurs selon les options données
   * @param options
   */
  async getIndicateursValeurs(options: GetIndicateursValeursOptions) {
    this.logger.log(
      `Récupération des valeurs des indicateurs selon ces options : ${JSON.stringify(options)}`,
    );

    const conditions: SQLWrapper[] = [
      eq(indicateurValeurTable.collectivite_id, options.collectiviteId),
    ];
    if (
      options.identifiantsReferentiel &&
      options.identifiantsReferentiel.length > 0
    ) {
      conditions.push(
        inArray(
          indicateurDefinitionTable.identifiant_referentiel,
          options.identifiantsReferentiel,
        ),
      );
    }
    if (options.dateDebut) {
      conditions.push(
        gte(indicateurValeurTable.date_valeur, options.dateDebut),
      );
    }
    if (options.dateFin) {
      conditions.push(lte(indicateurValeurTable.date_valeur, options.dateFin));
    }
    if (options.indicateurId) {
      conditions.push(eq(indicateurValeurTable.id, options.indicateurId));
    }
    if (options.sourceId) {
      conditions.push(
        eq(indicateurSourceMetadonneeTable.source_id, options.sourceId),
      );
    } else if (options.sourceId === null) {
      conditions.push(isNull(indicateurValeurTable.metadonnee_id));
    }

    const result = this.databaseService.db
      .select()
      .from(indicateurValeurTable)
      .leftJoin(
        indicateurDefinitionTable,
        eq(indicateurValeurTable.indicateur_id, indicateurDefinitionTable.id),
      )
      .leftJoin(
        indicateurSourceMetadonneeTable,
        eq(
          indicateurValeurTable.metadonnee_id,
          indicateurSourceMetadonneeTable.id,
        ),
      )
      .where(and(...conditions));

    // Enlève les doublons quand il y a plusieurs valeurs pour un même indicateur, collectivité, année
    // Garde en priorité la valeur utilisateur, puis celle avec la version la plus récente
    if (options.sourceId !== null && options.cleanDoublon === true) {
      // TODO adapter le code de packages/api/indicateur/indicateur.fetch.ts/selectIndicateursValeurs()
    }
    return result;
  }

  async getReferentielIndicateurDefinitions(identifiantsReferentiel: string[]) {
    this.logger.log(
      `Récupération des définitions des indicateurs ${identifiantsReferentiel.join(',')}`,
    );
    return this.databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(
        inArray(
          indicateurDefinitionTable.identifiant_referentiel,
          identifiantsReferentiel,
        ),
      );
  }

  async upsertIndicateurValeurs(
    indicateurValeurs: CreateIndicateurValeurType[],
  ) {
    // On doit distinguer les valeurs avec et sans métadonnées car la clause d'unicité est différente (onConflictDoUpdate)
    const indicateurValeursAvecMetadonnees = indicateurValeurs.filter(
      (v) => v.metadonnee_id,
    );
    const indicateurValeursSansMetadonnees = indicateurValeurs.filter(
      (v) => !v.metadonnee_id,
    );

    if (indicateurValeursAvecMetadonnees.length) {
      this.logger.log(
        `Upsert des ${indicateurValeursAvecMetadonnees.length} valeurs avec métadonnées des indicateurs ${[
          ...new Set(
            indicateurValeursAvecMetadonnees.map((v) => v.indicateur_id),
          ),
        ].join(
          ',',
        )} pour les collectivités ${[...new Set(indicateurValeursAvecMetadonnees.map((v) => v.collectivite_id))].join(',')}`,
      );
      return this.databaseService.db
        .insert(indicateurValeurTable)
        .values(indicateurValeursAvecMetadonnees)
        .onConflictDoUpdate({
          target: [
            indicateurValeurTable.indicateur_id,
            indicateurValeurTable.collectivite_id,
            indicateurValeurTable.date_valeur,
            indicateurValeurTable.metadonnee_id,
          ],
          targetWhere: isNotNull(indicateurValeurTable.metadonnee_id),
          set: {
            resultat: sql.raw(
              `excluded.${indicateurValeurTable.resultat.name}`,
            ),
            resultat_commentaire: sql.raw(
              `excluded.${indicateurValeurTable.resultat_commentaire.name}`,
            ),
            objectif: sql.raw(
              `excluded.${indicateurValeurTable.objectif.name}`,
            ),
            objectif_commentaire: sql.raw(
              `excluded.${indicateurValeurTable.objectif_commentaire.name}`,
            ),
          },
        })
        .returning();
    }

    if (indicateurValeursSansMetadonnees.length) {
      this.logger.log(
        `Upsert des ${indicateurValeursSansMetadonnees.length} valeurs sans métadonnées des indicateurs ${[
          ...new Set(
            indicateurValeursSansMetadonnees.map((v) => v.indicateur_id),
          ),
        ].join(
          ',',
        )} pour les collectivités ${[...new Set(indicateurValeursSansMetadonnees.map((v) => v.collectivite_id))].join(',')}`,
      );
      await this.databaseService.db
        .insert(indicateurValeurTable)
        .values(indicateurValeursSansMetadonnees)
        .onConflictDoUpdate({
          target: [
            indicateurValeurTable.indicateur_id,
            indicateurValeurTable.collectivite_id,
            indicateurValeurTable.date_valeur,
          ],
          targetWhere: isNull(indicateurValeurTable.metadonnee_id),
          set: {
            resultat: sql.raw(
              `excluded.${indicateurValeurTable.resultat.name}`,
            ),
            resultat_commentaire: sql.raw(
              `excluded.${indicateurValeurTable.resultat_commentaire.name}`,
            ),
            objectif: sql.raw(
              `excluded.${indicateurValeurTable.objectif.name}`,
            ),
            objectif_commentaire: sql.raw(
              `excluded.${indicateurValeurTable.objectif_commentaire.name}`,
            ),
          },
        });
    }
  }
}

/*
insert into "indicateur_valeur" ("id", "collectivite_id", "indicateur_id", "date_valeur", "metadonnee_id", "resultat", "resultat_commentaire", "objectif", "objectif_commentaire", "estimation", "modified_at", "created_at", "modified_by", "created_by") values (default, $1, $2, $3, $4, default, default, $5, default, default, default, default, default, default) on conflict ("indicateur_id","collectivite_id","date_valeur","metadonnee_id") do update set "objectif" = excluded.objectif where "indicateur_valeur"."metadonnee_id" is not null
*/
