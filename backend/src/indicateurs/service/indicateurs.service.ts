import { Injectable, Logger } from '@nestjs/common';
import {
  and,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
  SQL,
  SQLWrapper,
} from 'drizzle-orm';
import * as _ from 'lodash';
import DatabaseService from '../../common/services/database.service';
import {
  GetIndicateursValeursRequest,
  GetIndicateursValeursResponse,
} from '../models/getIndicateurs.models';
import {
  CreateIndicateurValeurType,
  IndicateurAvecValeurs,
  indicateurDefinitionTable,
  IndicateurDefinitionType,
  indicateurSourceMetadonneeTable,
  IndicateurValeurGroupee,
  indicateurValeurTable,
  IndicateurValeurType,
} from '../models/indicateur.models';

@Injectable()
export default class IndicateursService {
  private readonly logger = new Logger(IndicateursService.name);

  /**
   * Quand la source_id est NULL, cela signifie que ce sont des donnees saisies par la collectivite
   */
  public readonly NULL_SOURCE_ID = 'collectivite';

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Récupère les valeurs d'indicateurs selon les options données
   * @param options
   */
  async getIndicateursValeurs(options: GetIndicateursValeursRequest) {
    this.logger.log(
      `Récupération des valeurs des indicateurs selon ces options : ${JSON.stringify(options)}`,
    );

    const conditions: (SQLWrapper | SQL)[] = [
      eq(indicateurValeurTable.collectivite_id, options.collectivite_id),
    ];
    if (
      options.identifiants_referentiel &&
      options.identifiants_referentiel.length > 0
    ) {
      conditions.push(
        inArray(
          indicateurDefinitionTable.identifiant_referentiel,
          options.identifiants_referentiel,
        ),
      );
    }
    if (options.date_debut) {
      conditions.push(
        gte(indicateurValeurTable.date_valeur, options.date_debut),
      );
    }
    if (options.date_fin) {
      conditions.push(lte(indicateurValeurTable.date_valeur, options.date_fin));
    }
    if (options.indicateur_id) {
      conditions.push(eq(indicateurValeurTable.id, options.indicateur_id));
    }
    if (options.source_ids?.length) {
      const nullSourceId = options.source_ids.includes(this.NULL_SOURCE_ID);
      if (nullSourceId) {
        const autreSourceIds = options.source_ids.filter(
          (s) => s !== this.NULL_SOURCE_ID,
        );
        if (autreSourceIds.length) {
          const orCondition = or(
            isNull(indicateurSourceMetadonneeTable.source_id),
            inArray(indicateurSourceMetadonneeTable.source_id, autreSourceIds),
          );
          if (orCondition) {
            conditions.push(orCondition);
          }
        } else {
          conditions.push(isNull(indicateurSourceMetadonneeTable.source_id));
        }
      } else {
        conditions.push(
          inArray(
            indicateurSourceMetadonneeTable.source_id,
            options.source_ids,
          ),
        );
      }
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

    const sql = result.toSQL();
    console.log(JSON.stringify(sql));

    // Enlève les doublons quand il y a plusieurs valeurs pour un même indicateur, collectivité, année
    // Garde en priorité la valeur utilisateur, puis celle avec la version la plus récente
    /*if (options.source_id !== null && options.clean_doublon === true) {
      // TODO adapter le code de packages/api/indicateur/indicateur.fetch.ts/selectIndicateursValeurs()
    }*/
    return result;
  }

  async getIndicateurValeursGroupees(
    options: GetIndicateursValeursRequest,
  ): Promise<GetIndicateursValeursResponse> {
    const indicateurValeurs = await this.getIndicateursValeurs(options);
    const indicateurValeursSeules = indicateurValeurs.map(
      (v) => v.indicateur_valeur,
    );
    const initialAcc: { [key: string]: IndicateurDefinitionType } = {};
    const uniqueIndicateurDefinitions = Object.values(
      indicateurValeurs.reduce((acc, v) => {
        if (v.indicateur_definition?.id) {
          acc[v.indicateur_definition.id.toString()] = v.indicateur_definition;
        }
        return acc;
      }, initialAcc),
    ) as IndicateurDefinitionType[];
    uniqueIndicateurDefinitions.sort((a, b) => {
      if (!a.identifiant_referentiel && !b.identifiant_referentiel) {
        return 0;
      }
      if (!a.identifiant_referentiel) {
        return 1;
      }
      if (!b.identifiant_referentiel) {
        return -1;
      }
      return a.identifiant_referentiel.localeCompare(b.identifiant_referentiel);
    });

    // TODO: groupe par indicateur et source
    const indicateurValeurGroupees = this.groupeIndicateursValeursParIndicateur(
      indicateurValeursSeules,
      uniqueIndicateurDefinitions,
    );
    return { indicateurs: indicateurValeurGroupees };
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

  groupeIndicateursValeursParIndicateur(
    indicateurValeurs: IndicateurValeurType[],
    indicateurDefinitions: IndicateurDefinitionType[],
  ): IndicateurAvecValeurs[] {
    const indicateurAvecValeurs = indicateurDefinitions.map(
      (indicateurDefinition) => {
        const valeurs = indicateurValeurs
          .filter((v) => v.indicateur_id === indicateurDefinition.id)
          .map((v) => {
            const indicateurValeurGroupee: IndicateurValeurGroupee = {
              id: v.id,
              date_valeur: v.date_valeur,
              resultat: v.resultat,
              resultat_commentaire: v.resultat_commentaire,
              objectif: v.objectif,
              objectif_commentaire: v.objectif_commentaire,
              metadonnee_id: v.metadonnee_id, // TODO: to be removed
            };
            return _.omitBy(
              indicateurValeurGroupee,
              _.isNil,
            ) as IndicateurValeurGroupee;
          });
        // Trie les valeurs par date
        valeurs.sort((a, b) => {
          return a.date_valeur.localeCompare(b.date_valeur);
        });
        const indicateurAvecValeurs: IndicateurAvecValeurs = {
          definition: indicateurDefinition,
          valeurs,
        };
        return indicateurAvecValeurs;
      },
    );
    return indicateurAvecValeurs.filter((i) => i.valeurs.length > 0);
  }
}
