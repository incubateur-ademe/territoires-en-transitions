import { Injectable, Logger } from '@nestjs/common';
import {
  aliasedTable,
  and,
  eq,
  getTableColumns,
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
import { groupBy, partition } from 'es-toolkit';
import * as _ from 'lodash';
import { objectToCamel } from 'ts-case-convert';
import { AuthenticatedUser, AuthRole } from '../../../auth/models/auth.models';
import { NiveauAcces } from '../../../auth/models/private-utilisateur-droit.table';
import { AuthService } from '../../../auth/services/auth.service';
import { groupementCollectiviteTable } from '../../../collectivites/shared/models/groupement-collectivite.table';
import { groupementTable } from '../../../collectivites/shared/models/groupement.table';
import DatabaseService from '../../common/services/database.service';
import { DeleteIndicateursValeursRequestType } from '../../models/delete-indicateurs.request';
import { GetIndicateursValeursRequestType } from '../../models/get-indicateurs.request';
import { GetIndicateursValeursResponseType } from '../../models/get-indicateurs.response';
import {
  IndicateurDefinitionAvecEnfantsType,
  indicateurDefinitionTable,
  IndicateurDefinitionType,
  MinimalIndicateurDefinitionType,
} from '../../models/indicateur-definition.table';
import { indicateurGroupeTable } from '../../models/indicateur-groupe.table';
import {
  indicateurSourceMetadonneeTable,
  IndicateurSourceMetadonneeType,
} from '../../models/indicateur-source-metadonnee.table';
import {
  CreateIndicateurValeurType,
  IndicateurAvecValeursParSource,
  IndicateurAvecValeursType,
  IndicateurValeurAvecMetadonnesDefinition,
  IndicateurValeurGroupee,
  IndicateurValeursGroupeeParSource,
  indicateurValeurTable,
  IndicateurValeurType,
} from '../../models/indicateur-valeur.table';

@Injectable()
export default class IndicateursService {
  private readonly logger = new Logger(IndicateursService.name);

  /**
   * Quand la sourceId est NULL, cela signifie que ce sont des donnees saisies par la collectivite
   */
  static NULL_SOURCE_ID = 'collectivite';
  static NULL_SOURCE_LABEL = 'saisie manuelle';

  public readonly UNKOWN_SOURCE_ID = 'unknown';

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService
  ) {}

  private getIndicateurValeursSqlConditions(
    options: GetIndicateursValeursRequestType
  ): (SQLWrapper | SQL)[] {
    const conditions: (SQLWrapper | SQL)[] = [
      eq(indicateurValeurTable.collectiviteId, options.collectiviteId),
    ];
    if (
      options.identifiantsReferentiel &&
      options.identifiantsReferentiel.length > 0
    ) {
      conditions.push(
        inArray(
          indicateurDefinitionTable.identifiantReferentiel,
          options.identifiantsReferentiel
        )
      );
    }
    if (options.dateDebut) {
      conditions.push(gte(indicateurValeurTable.dateValeur, options.dateDebut));
    }
    if (options.dateFin) {
      conditions.push(lte(indicateurValeurTable.dateValeur, options.dateFin));
    }
    if (options.indicateurIds) {
      conditions.push(
        inArray(indicateurValeurTable.indicateurId, options.indicateurIds)
      );
    }
    if (options.sources?.length) {
      const nullSourceId = options.sources.includes(
        IndicateursService.NULL_SOURCE_ID
      );
      if (nullSourceId) {
        const autreSourceIds = options.sources.filter(
          (s) => s !== IndicateursService.NULL_SOURCE_ID
        );
        if (autreSourceIds.length) {
          const orCondition = or(
            isNull(indicateurSourceMetadonneeTable.sourceId),
            inArray(indicateurSourceMetadonneeTable.sourceId, autreSourceIds)
          );
          if (orCondition) {
            conditions.push(orCondition);
          }
        } else {
          conditions.push(isNull(indicateurSourceMetadonneeTable.sourceId));
        }
      } else {
        conditions.push(
          inArray(indicateurSourceMetadonneeTable.sourceId, options.sources)
        );
      }
    }
    return conditions;
  }

  /**
   * Récupère les valeurs d'indicateurs selon les options données
   * @param options
   */
  async getIndicateursValeurs(options: GetIndicateursValeursRequestType) {
    this.logger.log(
      `Récupération des valeurs des indicateurs selon ces options : ${JSON.stringify(
        options
      )}`
    );

    const conditions = this.getIndicateurValeursSqlConditions(options);

    let result = await this.databaseService.db
      .select()
      .from(indicateurValeurTable)
      .leftJoin(
        indicateurDefinitionTable,
        eq(indicateurValeurTable.indicateurId, indicateurDefinitionTable.id)
      )
      .leftJoin(
        indicateurSourceMetadonneeTable,
        eq(
          indicateurValeurTable.metadonneeId,
          indicateurSourceMetadonneeTable.id
        )
      )
      .where(and(...conditions));

    this.logger.log(`Récupération de ${result.length} valeurs d'indicateurs`);
    if (!options.ignoreDedoublonnage) {
      // Gère le cas où plusieurs fois la même source avec des métadonnées différentes > on garde les données de la métadonnée la plus récente
      result = this.dedoublonnageIndicateurValeursParSource(result);

      this.logger.log(
        `${result.length} valeurs d'indicateurs après dédoublonnage`
      );
    }

    return result;
  }

  async deleteIndicateurValeurs(options: DeleteIndicateursValeursRequestType) {
    this.logger.log(
      `Suppression des valeurs des indicateurs selon ces options : ${JSON.stringify(
        options
      )}`
    );

    const conditions: (SQLWrapper | SQL)[] = [
      eq(indicateurValeurTable.collectiviteId, options.collectiviteId),
    ];
    if (options.indicateurId) {
      conditions.push(
        eq(indicateurValeurTable.indicateurId, options.indicateurId)
      );
    }
    if (options.metadonneeId) {
      conditions.push(
        eq(indicateurValeurTable.metadonneeId, options.metadonneeId)
      );
    }

    const deleteQuery = this.databaseService.db
      .delete(indicateurValeurTable)
      .where(and(...conditions));

    const deletedIds = await deleteQuery.returning({
      id: indicateurValeurTable.id,
    });
    this.logger.log(
      `${deletedIds.length} valeurs d'indicateurs ont été supprimées`
    );
    return { indicateurValeurIdsSupprimes: deletedIds };
  }

  async getIndicateurValeursGroupees(
    options: GetIndicateursValeursRequestType,
    tokenInfo: AuthenticatedUser
  ): Promise<GetIndicateursValeursResponseType> {
    await this.authService.verifieAccesAuxCollectivites(
      tokenInfo,
      [options.collectiviteId],
      NiveauAcces.LECTURE
    );

    const indicateurValeurs = await this.getIndicateursValeurs(options);
    const indicateurValeursSeules = indicateurValeurs.map(
      (v) => v.indicateur_valeur
    );
    const initialDefinitionsAcc: { [key: string]: IndicateurDefinitionType } =
      {};
    let uniqueIndicateurDefinitions: IndicateurDefinitionType[];
    if (!options.identifiantsReferentiel?.length) {
      uniqueIndicateurDefinitions = Object.values(
        indicateurValeurs.reduce((acc, v) => {
          if (v.indicateur_definition?.id) {
            acc[v.indicateur_definition.id.toString()] =
              v.indicateur_definition;
          }
          return acc;
        }, initialDefinitionsAcc)
      ) as IndicateurDefinitionType[];
    } else {
      uniqueIndicateurDefinitions =
        await this.getReferentielIndicateurDefinitions(
          options.identifiantsReferentiel
        );
      options.identifiantsReferentiel.forEach((identifiant) => {
        if (
          !uniqueIndicateurDefinitions.find(
            (d) => d.identifiantReferentiel === identifiant
          )
        ) {
          this.logger.warn(
            `Définition de l'indicateur avec l'identifiant référentiel ${identifiant} introuvable`
          );
        }
      });
    }

    uniqueIndicateurDefinitions.sort((a, b) => {
      if (!a.identifiantReferentiel && !b.identifiantReferentiel) {
        return 0;
      }
      if (!a.identifiantReferentiel) {
        return 1;
      }
      if (!b.identifiantReferentiel) {
        return -1;
      }
      return a.identifiantReferentiel.localeCompare(b.identifiantReferentiel);
    });

    const initialMetadonneesAcc: {
      [key: string]: IndicateurSourceMetadonneeType;
    } = {};
    const uniqueIndicateurMetadonnees = Object.values(
      indicateurValeurs.reduce((acc, v) => {
        if (v.indicateur_source_metadonnee?.id) {
          acc[v.indicateur_source_metadonnee.id.toString()] =
            v.indicateur_source_metadonnee;
        }
        return acc;
      }, initialMetadonneesAcc)
    ) as IndicateurSourceMetadonneeType[];

    const indicateurValeurGroupeesParSource =
      this.groupeIndicateursValeursParIndicateurEtSource(
        indicateurValeursSeules,
        uniqueIndicateurDefinitions,
        uniqueIndicateurMetadonnees,
        false
      );
    return { indicateurs: indicateurValeurGroupeesParSource };
  }

  async getReferentielIndicateurDefinitions(identifiantsReferentiel: string[]) {
    this.logger.log(
      `Récupération des définitions des indicateurs ${identifiantsReferentiel.join(
        ','
      )}`
    );
    const definitions = await this.databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(
        inArray(
          indicateurDefinitionTable.identifiantReferentiel,
          identifiantsReferentiel
        )
      );
    this.logger.log(`${definitions.length} définitions trouvées`);
    return definitions;
  }

  /**
   * Charge la définition des indicateurs à partir de leur id
   * ainsi que les définitions des indicateurs "enfant" associés.
   */
  async getIndicateurDefinitions(
    collectiviteId: number,
    indicateurIds: number[]
  ): Promise<IndicateurDefinitionAvecEnfantsType[]> {
    this.logger.log(
      `Charge la définition des indicateurs ${indicateurIds.join(',')}`
    );

    const definitionEnfantsTable = aliasedTable(
      indicateurDefinitionTable,
      'enfants'
    );

    const definitions = await this.databaseService.db
      .select({
        ...getTableColumns(indicateurDefinitionTable),
        enfants: sql`json_agg(${definitionEnfantsTable})`,
      })
      .from(indicateurDefinitionTable)
      .leftJoin(
        indicateurGroupeTable,
        eq(indicateurGroupeTable.parent, indicateurDefinitionTable.id)
      )
      .leftJoin(
        definitionEnfantsTable,
        eq(definitionEnfantsTable.id, indicateurGroupeTable.enfant)
      )
      .leftJoin(
        groupementTable,
        eq(groupementTable.id, definitionEnfantsTable.groupementId)
      )
      .leftJoin(
        groupementCollectiviteTable,
        eq(groupementCollectiviteTable.groupementId, groupementTable.id)
      )
      .where(
        and(
          inArray(indicateurDefinitionTable.id, indicateurIds),
          or(
            isNull(definitionEnfantsTable.groupementId),
            eq(groupementCollectiviteTable.collectiviteId, collectiviteId)
          )
        )
      )
      .groupBy(indicateurDefinitionTable.id);

    this.logger.log(`${definitions.length} définitions trouvées`);

    return definitions.map(
      (def: IndicateurDefinitionType & { enfants: unknown[] }) => {
        const enfants = def.enfants?.filter(Boolean);
        return {
          ...def,
          enfants: enfants?.length
            ? (objectToCamel(enfants) as IndicateurDefinitionType[])
            : null,
        };
      }
    );
  }

  async upsertIndicateurValeurs(
    indicateurValeurs: CreateIndicateurValeurType[],
    tokenInfo: AuthenticatedUser
  ): Promise<IndicateurValeurType[]> {
    if (tokenInfo) {
      const collectiviteIds = [
        ...new Set(indicateurValeurs.map((v) => v.collectiviteId)),
      ];
      await this.authService.verifieAccesAuxCollectivites(
        tokenInfo,
        collectiviteIds,
        NiveauAcces.EDITION
      );

      if (tokenInfo.role === AuthRole.AUTHENTICATED && tokenInfo.id) {
        indicateurValeurs.forEach((v) => {
          v.createdBy = tokenInfo.id;
          v.modifiedBy = tokenInfo.id;
        });
      }
    }

    this.logger.log(
      `Upsert des ${indicateurValeurs.length} valeurs des indicateurs pour l'utilisateur ${tokenInfo.id} (role ${tokenInfo.role})`
    );
    // On doit distinguer les valeurs avec et sans métadonnées car la clause d'unicité est différente (onConflictDoUpdate)
    const [indicateurValeursAvecMetadonnees, indicateurValeursSansMetadonnees] =
      partition(indicateurValeurs, (v) => Boolean(v.metadonneeId));

    const indicateurValeursResultat: IndicateurValeurType[] = [];
    if (indicateurValeursAvecMetadonnees.length) {
      this.logger.log(
        `Upsert des ${
          indicateurValeursAvecMetadonnees.length
        } valeurs avec métadonnées des indicateurs ${[
          ...new Set(
            indicateurValeursAvecMetadonnees.map((v) => v.indicateurId)
          ),
        ].join(',')} pour les collectivités ${[
          ...new Set(
            indicateurValeursAvecMetadonnees.map((v) => v.collectiviteId)
          ),
        ].join(',')}`
      );
      const indicateurValeursAvecMetadonneesResultat =
        await this.databaseService.db
          .insert(indicateurValeurTable)
          .values(indicateurValeursAvecMetadonnees)
          .onConflictDoUpdate({
            target: [
              indicateurValeurTable.indicateurId,
              indicateurValeurTable.collectiviteId,
              indicateurValeurTable.dateValeur,
              indicateurValeurTable.metadonneeId,
            ],
            targetWhere: isNotNull(indicateurValeurTable.metadonneeId),
            set: {
              resultat: sql.raw(
                `excluded.${indicateurValeurTable.resultat.name}`
              ),
              resultatCommentaire: sql.raw(
                `excluded.${indicateurValeurTable.resultatCommentaire.name}`
              ),
              objectif: sql.raw(
                `excluded.${indicateurValeurTable.objectif.name}`
              ),
              objectifCommentaire: sql.raw(
                `excluded.${indicateurValeurTable.objectifCommentaire.name}`
              ),
              modifiedBy: sql.raw(
                `excluded.${indicateurValeurTable.modifiedBy.name}`
              ),
            },
          })
          .returning();
      indicateurValeursResultat.push(
        ...indicateurValeursAvecMetadonneesResultat
      );
    }

    if (indicateurValeursSansMetadonnees.length) {
      this.logger.log(
        `Upsert des ${
          indicateurValeursSansMetadonnees.length
        } valeurs sans métadonnées des indicateurs ${[
          ...new Set(
            indicateurValeursSansMetadonnees.map((v) => v.indicateurId)
          ),
        ].join(',')} pour les collectivités ${[
          ...new Set(
            indicateurValeursSansMetadonnees.map((v) => v.collectiviteId)
          ),
        ].join(',')}`
      );
      const indicateurValeursSansMetadonneesResultat =
        await this.databaseService.db
          .insert(indicateurValeurTable)
          .values(indicateurValeursSansMetadonnees)
          .onConflictDoUpdate({
            target: [
              indicateurValeurTable.indicateurId,
              indicateurValeurTable.collectiviteId,
              indicateurValeurTable.dateValeur,
            ],
            targetWhere: isNull(indicateurValeurTable.metadonneeId),
            set: {
              resultat: sql.raw(
                `excluded.${indicateurValeurTable.resultat.name}`
              ),
              resultatCommentaire: sql.raw(
                `excluded.${indicateurValeurTable.resultatCommentaire.name}`
              ),
              objectif: sql.raw(
                `excluded.${indicateurValeurTable.objectif.name}`
              ),
              objectifCommentaire: sql.raw(
                `excluded.${indicateurValeurTable.objectifCommentaire.name}`
              ),
              modifiedBy: sql.raw(
                `excluded.${indicateurValeurTable.modifiedBy.name}`
              ),
            },
          })
          .returning();
      indicateurValeursResultat.push(
        ...indicateurValeursSansMetadonneesResultat
      );
    }
    return indicateurValeursResultat;
  }

  dedoublonnageIndicateurValeursParSource(
    indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[]
  ): IndicateurValeurAvecMetadonnesDefinition[] {
    const initialAcc: {
      [key: string]: IndicateurValeurAvecMetadonnesDefinition;
    } = {};
    const uniqueIndicateurValeurs = Object.values(
      indicateurValeurs.reduce((acc, v) => {
        const cleUnicite = `${v.indicateur_valeur.indicateurId}_${
          v.indicateur_valeur.collectiviteId
        }_${v.indicateur_valeur.dateValeur}_${
          v.indicateur_source_metadonnee?.sourceId ||
          IndicateursService.NULL_SOURCE_ID
        }`;
        if (!acc[cleUnicite]) {
          acc[cleUnicite] = v;
        } else {
          // On garde la valeur la plus récente en priorité
          if (
            v.indicateur_source_metadonnee &&
            acc[cleUnicite].indicateur_source_metadonnee &&
            v.indicateur_source_metadonnee.dateVersion >
              acc[cleUnicite].indicateur_source_metadonnee!.dateVersion
          ) {
            acc[cleUnicite] = v;
          }
        }
        return acc;
      }, initialAcc)
    ) as IndicateurValeurAvecMetadonnesDefinition[];
    return uniqueIndicateurValeurs;
  }

  groupeIndicateursValeursParIndicateur(
    indicateurValeurs: IndicateurValeurType[],
    indicateurDefinitions: IndicateurDefinitionType[],
    commentairesNonInclus = false
  ): IndicateurAvecValeursType[] {
    const initialDefinitionsAcc: {
      [key: string]: MinimalIndicateurDefinitionType;
    } = {};
    const uniqueIndicateurDefinitions = Object.values(
      indicateurDefinitions.reduce((acc, def) => {
        if (def?.id) {
          const minimaleIndicateurDefinition = _.pick<IndicateurDefinitionType>(
            def,
            [
              'id',
              'identifiantReferentiel',
              'titre',
              'titreLong',
              'description',
              'unite',
              'borneMin',
              'borneMax',
            ]
          ) as MinimalIndicateurDefinitionType;
          acc[def.id.toString()] = minimaleIndicateurDefinition;
        }
        return acc;
      }, initialDefinitionsAcc)
    ) as IndicateurDefinitionType[];

    const indicateurAvecValeurs = uniqueIndicateurDefinitions.map(
      (indicateurDefinition) => {
        const valeurs = indicateurValeurs
          .filter((v) => v.indicateurId === indicateurDefinition.id)
          .map((v) => {
            const indicateurValeurGroupee: IndicateurValeurGroupee = {
              id: v.id,
              dateValeur: v.dateValeur,
              resultat: v.resultat,
              objectif: v.objectif,
              metadonneeId: null,
            };
            if (!commentairesNonInclus) {
              indicateurValeurGroupee.resultatCommentaire =
                v.resultatCommentaire;
              indicateurValeurGroupee.objectifCommentaire =
                v.objectifCommentaire;
            }
            return _.omitBy(
              indicateurValeurGroupee,
              _.isNil
            ) as IndicateurValeurGroupee;
          });
        // Trie les valeurs par date
        valeurs.sort((a, b) => {
          return a.dateValeur.localeCompare(b.dateValeur);
        });
        const indicateurAvecValeurs: IndicateurAvecValeursType = {
          definition: indicateurDefinition,
          valeurs,
        };
        return indicateurAvecValeurs;
      }
    );
    return indicateurAvecValeurs.filter((i) => i.valeurs.length > 0);
  }

  groupeIndicateursValeursParIndicateurEtSource(
    indicateurValeurs: IndicateurValeurType[],
    indicateurDefinitions: IndicateurDefinitionType[],
    indicateurMetadonnees: IndicateurSourceMetadonneeType[],
    supprimeIndicateursSansValeurs = true
  ): IndicateurAvecValeursParSource[] {
    const initialDefinitionsAcc: { [key: string]: IndicateurDefinitionType } =
      {};
    const uniqueIndicateurDefinitions = Object.values(
      indicateurDefinitions.reduce((acc, def) => {
        if (def?.id) {
          acc[def.id.toString()] = def;
        }
        return acc;
      }, initialDefinitionsAcc)
    ) as IndicateurDefinitionType[];

    const indicateurAvecValeurs = uniqueIndicateurDefinitions.map(
      (indicateurDefinition) => {
        const valeurs = indicateurValeurs
          .filter((v) => v.indicateurId === indicateurDefinition.id)
          .map((v) => {
            const indicateurValeurGroupee: IndicateurValeurGroupee = {
              id: v.id,
              dateValeur: v.dateValeur,
              resultat: v.resultat,
              resultatCommentaire: v.resultatCommentaire,
              objectif: v.objectif,
              objectifCommentaire: v.objectifCommentaire,
              metadonneeId: v.metadonneeId,
            };
            return _.omitBy(
              indicateurValeurGroupee,
              _.isNil
            ) as IndicateurValeurGroupee;
          });

        const metadonneesUtilisees: Record<
          string,
          Record<string, IndicateurSourceMetadonneeType>
        > = {};
        const valeursParSource = groupBy(valeurs, (valeur) => {
          if (!valeur.metadonneeId) {
            return IndicateursService.NULL_SOURCE_ID;
          }
          const metadonnee = indicateurMetadonnees.find(
            (m) => m.id === valeur.metadonneeId
          );
          if (!metadonnee) {
            this.logger.warn(
              `Metadonnée introuvable pour l'identifiant ${valeur.metadonneeId}`
            );
            return this.UNKOWN_SOURCE_ID;
          } else {
            if (!metadonneesUtilisees[metadonnee.sourceId]) {
              metadonneesUtilisees[metadonnee.sourceId] = {};
            }
            if (!metadonneesUtilisees[metadonnee.sourceId][metadonnee.id]) {
              metadonneesUtilisees[metadonnee.sourceId][metadonnee.id] =
                metadonnee;
            }
            return metadonnee.sourceId;
          }
        });
        const sourceMap: Record<string, IndicateurValeursGroupeeParSource> = {};
        for (const sourceId of Object.keys(valeursParSource)) {
          // Trie les valeurs par date
          valeursParSource[sourceId] = valeursParSource[sourceId].sort(
            (a, b) => {
              return a.dateValeur.localeCompare(b.dateValeur);
            }
          );
          sourceMap[sourceId] = {
            source: sourceId,
            metadonnees: Object.values(metadonneesUtilisees[sourceId] || {}),
            valeurs: valeursParSource[sourceId],
          };
        }
        const IndicateurAvecValeursParSource: IndicateurAvecValeursParSource = {
          definition: indicateurDefinition,
          sources: sourceMap,
        };
        return IndicateurAvecValeursParSource;
      }
    );

    if (supprimeIndicateursSansValeurs) {
      return indicateurAvecValeurs.filter(
        (i) => Object.keys(i.sources).length > 0
      );
    } else {
      return indicateurAvecValeurs;
    }
  }
}
