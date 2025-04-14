import { PermissionOperation } from '@/backend/auth/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { ResourceType } from '@/backend/auth/authorizations/resource-type.enum';
import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { indicateurCollectiviteTable } from '@/backend/indicateurs/shared/models/indicateur-collectivite.table';
import { indicateurSourceSourceCalculTable } from '@/backend/indicateurs/shared/models/indicateur-source-source-calcul.table';
import IndicateurSourcesService from '@/backend/indicateurs/sources/indicateur-sources.service';
import IndicateurValeurExpressionParserService from '@/backend/indicateurs/valeurs/indicateur-valeur-expression-parser.service';
import { buildConflictUpdateColumns } from '@/backend/utils/database/conflict.utils';
import { getErrorMessage, roundTo } from '@/backend/utils/index-domain';
import { createZodDto } from '@anatine/zod-nestjs';
import { extendApi } from '@anatine/zod-openapi';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
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
import { chunk, groupBy, isNil, keyBy, partition } from 'es-toolkit';
import * as _ from 'lodash';
import {
  AuthenticatedUser,
  AuthRole,
  AuthUser,
} from '../../auth/models/auth.models';
import { DatabaseService } from '../../utils/database/database.service';
import { indicateurSourceTable, Source } from '../index-domain';
import { ListDefinitionsService } from '../list-definitions/list-definitions.service';
import { DeleteIndicateursValeursRequestType } from '../shared/models/delete-indicateurs.request';
import { DeleteValeurIndicateur } from '../shared/models/delete-valeur-indicateur.request';
import { GetIndicateursValeursRequestType } from '../shared/models/get-indicateurs.request';
import { GetIndicateursValeursResponseType } from '../shared/models/get-indicateurs.response';
import {
  IndicateurDefinition,
  IndicateurDefinitionEssential,
  indicateurDefinitionTable,
} from '../shared/models/indicateur-definition.table';
import {
  indicateurSourceMetadonneeTable,
  SourceMetadonnee,
} from '../shared/models/indicateur-source-metadonnee.table';
import {
  IndicateurAvecValeurs,
  indicateurAvecValeursParSourceSchema,
  IndicateurValeur,
  IndicateurValeurAvecMetadonnesDefinition,
  indicateurValeurGroupeeSchema,
  IndicateurValeurInsert,
  indicateurValeursGroupeeParSourceSchema,
  indicateurValeurTable,
  IndicateurValeurWithIdentifiant,
} from '../shared/models/indicateur-valeur.table';
import { UpsertValeurIndicateur } from '../shared/models/upsert-valeur-indicateur.request';

export class IndicateurValeurGroupee extends createZodDto(
  extendApi(indicateurValeurGroupeeSchema)
) {}

export class IndicateurValeursGroupeeParSource extends createZodDto(
  extendApi(indicateurValeursGroupeeParSourceSchema)
) {}

export class IndicateurAvecValeursParSource extends createZodDto(
  extendApi(indicateurAvecValeursParSourceSchema)
) {}

@Injectable()
export default class CrudValeursService {
  private readonly logger = new Logger(CrudValeursService.name);

  /**
   * Quand la sourceId est NULL, cela signifie que ce sont des donnees saisies par la collectivite
   */
  static NULL_SOURCE_ID = 'collectivite';
  static NULL_SOURCE_LABEL = 'saisie manuelle';

  /**
   * By default, we can use the INSEE source to calculate the values for other sources
   */
  static DEFAULT_SOURCE_CALCUL_IDS = ['insee'];

  public readonly UNKOWN_SOURCE_ID = 'unknown';

  private readonly PARALLEL_COLLECTIVITE_COMPUTE_VALEURS = 1;

  /**
   * Number of decimal in order to round the value
   */
  static DEFAULT_ROUNDING_PRECISION = 2;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly collectiviteService: CollectivitesService,
    private readonly indicateurDefinitionService: ListDefinitionsService,
    private readonly indicateurSourceService: IndicateurSourcesService,
    private readonly indicateurValeurExpressionParserService: IndicateurValeurExpressionParserService
  ) {}

  private getIndicateurValeursSqlConditions(
    options: GetIndicateursValeursRequestType
  ): (SQLWrapper | SQL)[] {
    const conditions: (SQLWrapper | SQL)[] = [];
    if (options.collectiviteId) {
      conditions.push(
        eq(indicateurValeurTable.collectiviteId, options.collectiviteId)
      );
    }
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
        CrudValeursService.NULL_SOURCE_ID
      );
      if (nullSourceId) {
        const autreSourceIds = options.sources.filter(
          (s) => s !== CrudValeursService.NULL_SOURCE_ID
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
      .select({
        indicateur_valeur: getTableColumns(indicateurValeurTable),
        indicateur_definition: getTableColumns(indicateurDefinitionTable),
        indicateur_source_metadonnee: getTableColumns(
          indicateurSourceMetadonneeTable
        ),
        confidentiel: indicateurCollectiviteTable.confidentiel,
      })
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
      .leftJoin(
        indicateurCollectiviteTable,
        eq(
          indicateurCollectiviteTable.indicateurId,
          indicateurDefinitionTable.id
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
    tokenInfo: AuthUser
  ): Promise<GetIndicateursValeursResponseType> {
    const { collectiviteId, indicateurIds, identifiantsReferentiel } = options;

    // Vérifie les droits
    let hasPermissionLecture;
    if (collectiviteId) {
      const collectivitePrivate = await this.collectiviteService.isPrivate(
        collectiviteId
      );
      hasPermissionLecture = await this.permissionService.isAllowed(
        tokenInfo,
        PermissionOperation.INDICATEURS_LECTURE,
        ResourceType.COLLECTIVITE,
        collectiviteId,
        true
      );
      const hasPermissionVisite = await this.permissionService.isAllowed(
        tokenInfo,
        PermissionOperation.INDICATEURS_VISITE,
        ResourceType.COLLECTIVITE,
        collectiviteId,
        true
      );
      const accesRestreintRequis = collectivitePrivate && !hasPermissionLecture;
      if (accesRestreintRequis || !hasPermissionVisite) {
        throw new UnauthorizedException(
          `Droits insuffisants, l'utilisateur ${
            tokenInfo.id
          } n'a pas l'autorisation ${
            accesRestreintRequis
              ? PermissionOperation.INDICATEURS_LECTURE
              : PermissionOperation.INDICATEURS_VISITE
          } sur la ressource Collectivité ${collectiviteId}`
        );
      }
    } else {
      // Check if has service role
      this.permissionService.hasServiceRole(tokenInfo);
      hasPermissionLecture = true;
    }

    if (!indicateurIds?.length && !identifiantsReferentiel?.length) {
      throw new BadRequestException(
        `indicateurIds or identifiantsReferentiel required`
      );
    }

    const indicateurValeurs = await this.getIndicateursValeurs(options);
    const indicateurValeursSeules = indicateurValeurs.map((v) => ({
      ...v.indicateur_valeur,
      confidentiel: v.confidentiel,
    }));
    const initialDefinitionsAcc: { [key: string]: IndicateurDefinition } = {};
    let uniqueIndicateurDefinitions: IndicateurDefinition[];
    if (!options.identifiantsReferentiel?.length) {
      uniqueIndicateurDefinitions = Object.values(
        indicateurValeurs.reduce((acc, v) => {
          if (v.indicateur_definition?.id) {
            acc[v.indicateur_definition.id.toString()] =
              v.indicateur_definition;
          }
          return acc;
        }, initialDefinitionsAcc)
      ) as IndicateurDefinition[];
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
      [key: string]: SourceMetadonnee;
    } = {};
    const uniqueIndicateurMetadonnees = Object.values(
      indicateurValeurs.reduce((acc, v) => {
        if (v.indicateur_source_metadonnee?.id) {
          acc[v.indicateur_source_metadonnee.id.toString()] =
            v.indicateur_source_metadonnee;
        }
        return acc;
      }, initialMetadonneesAcc)
    ) as SourceMetadonnee[];

    const sources = await this.databaseService.db
      .select()
      .from(indicateurSourceTable)
      .where(
        inArray(
          indicateurSourceTable.id,
          uniqueIndicateurMetadonnees.map((metadonnee) => metadonnee.sourceId)
        )
      );

    const indicateurValeurGroupeesParSource =
      this.groupeIndicateursValeursParIndicateurEtSource(
        indicateurValeursSeules,
        uniqueIndicateurDefinitions,
        uniqueIndicateurMetadonnees,
        sources,
        false
      );

    // Filtre la dernière valeur résultat d'un indicateur confidentiel quand
    // l'utilisateur n'a pas le droit requis
    if (!hasPermissionLecture) {
      indicateurValeurGroupeesParSource.forEach((indicateur) => {
        const sourceCollectivite =
          indicateur.sources[CrudValeursService.NULL_SOURCE_ID];
        if (sourceCollectivite?.valeurs?.[0]?.confidentiel) {
          // recherche la date la plus récente avec un résultat
          const timeDerniereValeur = Math.max(
            ...sourceCollectivite.valeurs
              .filter((v) => !isNil(v.resultat))
              .map((v) =>
                v.dateValeur ? new Date(v.dateValeur as string).getTime() : 0
              )
          );
          sourceCollectivite.valeurs = sourceCollectivite.valeurs.map((v) => ({
            ...v,
            // masque le résultat si nécessaire
            resultat:
              !isNil(v.resultat) &&
              v.dateValeur &&
              new Date(v.dateValeur as string).getTime() === timeDerniereValeur
                ? null
                : v.resultat,
          }));
        }
      });
    }
    return {
      count: indicateurValeurs.length,
      indicateurs: indicateurValeurGroupeesParSource,
    };
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
   * Variante de `upsertIndicateurValeurs` qui permet de ne pas être obligé de
   * redonner l'objet complet sans pour autant écraser la valeur existante. Et
   * donc de mettre à jour la colonne resultat indépendamment de la valeur
   * objectif (et pareil pour les commentaires).
   */
  async upsertValeur(data: UpsertValeurIndicateur, tokenInfo: AuthUser) {
    const { collectiviteId } = data;
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperation.INDICATEURS_EDITION,
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    if (tokenInfo.role === AuthRole.AUTHENTICATED && tokenInfo.id) {
      const indicateurDefinitions =
        await this.indicateurDefinitionService.getIndicateurDefinitions([
          data.indicateurId,
        ]);
      if (indicateurDefinitions.length === 0) {
        throw new BadRequestException(
          `Indicateur definition not found for id ${data.indicateurId}`
        );
      }
      const indicateurDefinition = indicateurDefinitions[0];
      if (!isNil(data.resultat)) {
        data.resultat = roundTo(data.resultat, indicateurDefinition.precision);
      }
      if (!isNil(data.objectif)) {
        data.objectif = roundTo(data.objectif, indicateurDefinition.precision);
      }

      const now = new Date().toISOString();
      let upsertedIndicateurValeur: IndicateurValeur | undefined = undefined;
      if (!isNil(data.id)) {
        this.logger.log(
          `Mise à jour de la valeur id ${data.id} pour la collectivité ${data.collectiviteId}`
        );
        const updated = await this.databaseService.db
          .update(indicateurValeurTable)
          .set({
            resultat: data.resultat,
            resultatCommentaire: data.resultatCommentaire,
            objectif: data.objectif,
            objectifCommentaire: data.objectifCommentaire,
            modifiedBy: tokenInfo.id,
            modifiedAt: now,
          })
          .where(
            and(
              eq(indicateurValeurTable.collectiviteId, collectiviteId),
              eq(indicateurValeurTable.id, data.id)
            )
          )
          .returning();
        upsertedIndicateurValeur = updated[0];
      } else if (!isNil(data.dateValeur)) {
        this.logger.log(
          `Insertion de la valeur de l'indicateur ${data.indicateurId} pour la collectivité ${data.collectiviteId}`
        );
        const inserted = await this.databaseService.db
          .insert(indicateurValeurTable)
          .values({
            collectiviteId,
            indicateurId: data.indicateurId,
            dateValeur: data.dateValeur,
            resultat: data.resultat,
            resultatCommentaire: data.resultatCommentaire,
            objectif: data.objectif,
            objectifCommentaire: data.objectifCommentaire,
            createdBy: tokenInfo.id,
            createdAt: now,
            modifiedBy: tokenInfo.id,
            modifiedAt: now,
            metadonneeId: null,
          })
          .onConflictDoUpdate({
            target: [
              indicateurValeurTable.indicateurId,
              indicateurValeurTable.collectiviteId,
              indicateurValeurTable.dateValeur,
            ],
            targetWhere: isNull(indicateurValeurTable.metadonneeId),
            set: buildConflictUpdateColumns(indicateurValeurTable, [
              'objectifCommentaire',
              'resultatCommentaire',
              'modifiedBy',
              'modifiedAt',
            ]),
          })
          .returning();
        upsertedIndicateurValeur = inserted[0];
      }

      if (upsertedIndicateurValeur) {
        const calculatedIndicateurValeur =
          await this.updateCalculatedIndicateurValeurs(
            [upsertedIndicateurValeur],
            [indicateurDefinition]
          );
        this.logger.log(
          `${calculatedIndicateurValeur.length} valeurs d'indicateurs calculées`
        );
      }

      return upsertedIndicateurValeur;
    }
  }

  async deleteValeurIndicateur(
    data: DeleteValeurIndicateur,
    tokenInfo: AuthUser
  ) {
    const { collectiviteId, indicateurId, id } = data;
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperation.INDICATEURS_EDITION,
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    if (tokenInfo.role === AuthRole.AUTHENTICATED && tokenInfo.id) {
      await this.databaseService.db
        .delete(indicateurValeurTable)
        .where(
          and(
            eq(indicateurValeurTable.collectiviteId, collectiviteId),
            eq(indicateurValeurTable.indicateurId, indicateurId),
            eq(indicateurValeurTable.id, id)
          )
        );
    }
  }

  async upsertIndicateurValeurs(
    indicateurValeurs: IndicateurValeurInsert[],
    tokenInfo: AuthenticatedUser | undefined
  ): Promise<IndicateurValeurWithIdentifiant[]> {
    const collectiviteIds = [
      ...new Set(indicateurValeurs.map((v) => v.collectiviteId)),
    ];
    if (tokenInfo) {
      for (const collectiviteId of collectiviteIds) {
        await this.permissionService.isAllowed(
          tokenInfo,
          PermissionOperation.INDICATEURS_EDITION,
          ResourceType.COLLECTIVITE,
          collectiviteId
        );
      }

      if (tokenInfo.role === AuthRole.AUTHENTICATED && tokenInfo.id) {
        indicateurValeurs.forEach((v) => {
          v.createdBy = tokenInfo.id;
          v.modifiedBy = tokenInfo.id;
        });
      }
    }

    this.logger.log(
      `Upsert des ${indicateurValeurs.length} valeurs des indicateurs pour l'utilisateur ${tokenInfo?.id} (role ${tokenInfo?.role})`
    );

    // Retrieve indicateur definition to be able to round values
    const indicateurIds = [
      ...new Set(indicateurValeurs.map((v) => v.indicateurId)),
    ];
    const indicateurDefinitions =
      await this.indicateurDefinitionService.getIndicateurDefinitions(
        indicateurIds
      );
    const indicateurDefinitionsById = keyBy(
      indicateurDefinitions,
      (item) => item.id
    );
    // Round values for each record
    indicateurValeurs.forEach((v) => {
      const definition = indicateurDefinitionsById[v.indicateurId];
      if (definition) {
        v.resultat = roundTo(v.resultat, definition.precision);
        v.objectif = roundTo(v.objectif, definition.precision);
      } else {
        throw new BadRequestException(
          `Indicateur definition not found for id ${v.indicateurId}`
        );
      }
    });

    // On doit distinguer les valeurs avec et sans métadonnées car la clause d'unicité est différente (onConflictDoUpdate)
    let [indicateurValeursAvecMetadonnees, indicateurValeursSansMetadonnees] =
      partition(indicateurValeurs, (v) => Boolean(v.metadonneeId));
    const indicateurValeursResultat: IndicateurValeurWithIdentifiant[] = [];
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
      try {
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
                calculAuto: sql.raw(
                  `excluded.${indicateurValeurTable.calculAuto.name}`
                ),
                calculAutoIdentifiantsManquants: sql.raw(
                  `excluded.${indicateurValeurTable.calculAutoIdentifiantsManquants.name}`
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
      } catch (e) {
        this.logger.error(
          `Erreur lors de l'upsert des valeurs avec métadonnées pour les collectivités ${collectiviteIds} : ${getErrorMessage(
            e
          )}`
        );
        this.logger.log(
          `Données en erreur : ${JSON.stringify(
            indicateurValeursAvecMetadonnees
          )}`
        );
        throw e;
      }
    }

    if (indicateurValeursSansMetadonnees.length) {
      let indicateurValeursSansMetadonneesToInsert: IndicateurValeurInsert[] =
        indicateurValeursSansMetadonnees;

      // Vérifie si les données à insérer sont autocalculées, si c'est le cas, on ne doit pas écraser les données des collectivités saisies manuellement
      const indicateurValeursAutocalculees =
        indicateurValeursSansMetadonneesToInsert.filter((v) => v.calculAuto);
      if (indicateurValeursAutocalculees.length) {
        const indicateurValeursAutocalculeesConditions: (SQLWrapper | SQL)[] =
          [];
        indicateurValeursAutocalculees.forEach((v) => {
          indicateurValeursAutocalculeesConditions.push(
            and(
              eq(indicateurValeurTable.indicateurId, v.indicateurId),
              eq(indicateurValeurTable.collectiviteId, v.collectiviteId),
              eq(indicateurValeurTable.dateValeur, v.dateValeur),
              isNull(indicateurValeurTable.metadonneeId),
              or(
                isNull(indicateurValeurTable.calculAuto),
                eq(indicateurValeurTable.calculAuto, false)
              )
            )!
          );
        });
        const valeursSaisiesManuellementExistantes =
          await this.databaseService.db
            .select()
            .from(indicateurValeurTable)
            .where(or(...indicateurValeursAutocalculeesConditions));
        this.logger.log(
          `${valeursSaisiesManuellementExistantes.length} valeurs saisies manuellement existantes pour les indicateurs`
        );
        if (valeursSaisiesManuellementExistantes.length) {
          indicateurValeursSansMetadonneesToInsert =
            indicateurValeursSansMetadonneesToInsert.filter((v) => {
              const valeurSaisiesManuellementExistante =
                valeursSaisiesManuellementExistantes.find(
                  (v2) =>
                    v2.indicateurId === v.indicateurId &&
                    v2.collectiviteId === v.collectiviteId &&
                    v2.dateValeur === v.dateValeur
                );
              return !valeurSaisiesManuellementExistante;
            });
          this.logger.log(
            `${indicateurValeursSansMetadonneesToInsert.length} valeurs à insérer après filtrage des données saisies manuellement`
          );
        }
      }
      if (indicateurValeursSansMetadonneesToInsert.length) {
        try {
          this.logger.log(
            `Upsert des ${
              indicateurValeursSansMetadonneesToInsert.length
            } valeurs sans métadonnées des indicateurs ${[
              ...new Set(
                indicateurValeursSansMetadonneesToInsert.map(
                  (v) => v.indicateurId
                )
              ),
            ].join(',')} pour les collectivités ${[
              ...new Set(
                indicateurValeursSansMetadonneesToInsert.map(
                  (v) => v.collectiviteId
                )
              ),
            ].join(',')}`
          );

          const indicateurValeursSansMetadonneesResultat =
            await this.databaseService.db
              .insert(indicateurValeurTable)
              .values(indicateurValeursSansMetadonneesToInsert)
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
                  calculAuto: sql.raw(
                    `excluded.${indicateurValeurTable.calculAuto.name}`
                  ),
                  calculAutoIdentifiantsManquants: sql.raw(
                    `excluded.${indicateurValeurTable.calculAutoIdentifiantsManquants.name}`
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
        } catch (e) {
          this.logger.error(
            `Erreur lors de l'upsert des valeurs sans métadonnées pour les collectivités ${collectiviteIds} : ${getErrorMessage(
              e
            )}`
          );
          this.logger.log(
            `Données en erreur : ${JSON.stringify(
              indicateurValeursSansMetadonneesToInsert
            )}`
          );
          throw e;
        }
      }
    }
    indicateurValeursResultat.forEach((v) => {
      if (
        !v.indicateurIdentifiant &&
        indicateurDefinitionsById[`${v.indicateurId}`]
      ) {
        v.indicateurIdentifiant =
          indicateurDefinitionsById[`${v.indicateurId}`].identifiantReferentiel;
      }
    });

    if (indicateurValeursResultat.length) {
      const calculatedIndicateursResultat =
        await this.updateCalculatedIndicateurValeurs(indicateurValeursResultat);
      this.logger.log(
        `${calculatedIndicateursResultat.length} valeurs d'indicateurs calculées`
      );
      indicateurValeursResultat.push(...calculatedIndicateursResultat);
    }

    return indicateurValeursResultat;
  }

  private getSourceIndicateurKeyForCalculatedIndicateurValeur(
    indicateurValeur: IndicateurValeurWithIdentifiant,
    forceSourceId?: string
  ): string | null {
    return `${indicateurValeur.collectiviteId}_${indicateurValeur.dateValeur}_${
      forceSourceId ||
      indicateurValeur.sourceId ||
      CrudValeursService.NULL_SOURCE_ID
    }`;
  }

  /**
   * TODO: unit test
   * @param targetIndicateurDefinition
   * @param sourceIndicateurValeurs
   * @param allowedExtraSourcesForCalculatedValues
   * @param relatedSourceIndicateurValeursByDate
   * @param allowToAddEntry
   * @returns
   */
  private fillRelatedSourceIndicateurValeursByDate(
    targetIndicateurDefinition: IndicateurDefinition,
    sourceIndicateurValeurs: IndicateurValeurWithIdentifiant[],
    allowedExtraSourcesForCalculatedValues: {
      sourceId: string;
      sourceCalculIds: string[];
    }[],
    relatedSourceIndicateurValeursByDate: {
      [collectiviteIdDateSourceIdKey: string]: {
        collectiviteId: number;
        valeurs: IndicateurValeurWithIdentifiant[];
        sourceId?: string | null;
        metadonneeId: number | null;
        missingIdentifiants: string[];
        date: string;
      };
    },
    allowToAddEntry: boolean
  ) {
    // Find related source indicateur valeurs grouped by date/sourceId
    if (targetIndicateurDefinition.valeurCalcule) {
      const neededSourceIndicateurs =
        this.indicateurValeurExpressionParserService.extractNeededSourceIndicateursFromFormula(
          targetIndicateurDefinition.valeurCalcule
        );

      sourceIndicateurValeurs
        .filter(
          (v) =>
            v.indicateurIdentifiant &&
            neededSourceIndicateurs.find(
              (ind) => ind.identifiant === v.indicateurIdentifiant
            )
        )
        .forEach((v) => {
          const collectiviteIdDateSourceIdKey =
            this.getSourceIndicateurKeyForCalculatedIndicateurValeur(v);
          if (collectiviteIdDateSourceIdKey) {
            if (
              !relatedSourceIndicateurValeursByDate[
                collectiviteIdDateSourceIdKey
              ] &&
              allowToAddEntry
            ) {
              relatedSourceIndicateurValeursByDate[
                collectiviteIdDateSourceIdKey
              ] = {
                collectiviteId: v.collectiviteId,
                valeurs: [],
                sourceId: v.sourceId,
                metadonneeId: v.metadonneeId,
                date: v.dateValeur,
                missingIdentifiants: [],
              };
            }

            if (
              relatedSourceIndicateurValeursByDate[
                collectiviteIdDateSourceIdKey
              ]
            ) {
              const dateRelatedSourceIndicateurValeurs =
                relatedSourceIndicateurValeursByDate[
                  collectiviteIdDateSourceIdKey
                ];
              if (!dateRelatedSourceIndicateurValeurs.metadonneeId) {
                dateRelatedSourceIndicateurValeurs.metadonneeId =
                  v.metadonneeId;
              }
              dateRelatedSourceIndicateurValeurs.valeurs.push(v);
            }

            // Also add the valeur to other sources if the source can be used to calculate other source
            for (const source of allowedExtraSourcesForCalculatedValues) {
              if (
                source.sourceCalculIds.includes(
                  v.sourceId || CrudValeursService.NULL_SOURCE_ID
                )
              ) {
                this.logger.log(
                  `Value of indicateur ${v.indicateurIdentifiant} for source ${v.sourceId} can be used to calculate source ${source.sourceId}`
                );

                const collectiviteIdDateSourceIdKey =
                  this.getSourceIndicateurKeyForCalculatedIndicateurValeur(
                    v,
                    source.sourceId
                  );
                if (collectiviteIdDateSourceIdKey) {
                  if (
                    !relatedSourceIndicateurValeursByDate[
                      collectiviteIdDateSourceIdKey
                    ] &&
                    allowToAddEntry
                  ) {
                    relatedSourceIndicateurValeursByDate[
                      collectiviteIdDateSourceIdKey
                    ] = {
                      collectiviteId: v.collectiviteId,
                      valeurs: [],
                      sourceId: source.sourceId,
                      metadonneeId: null,
                      date: v.dateValeur,
                      missingIdentifiants: [],
                    };
                  }

                  if (
                    relatedSourceIndicateurValeursByDate[
                      collectiviteIdDateSourceIdKey
                    ]
                  ) {
                    relatedSourceIndicateurValeursByDate[
                      collectiviteIdDateSourceIdKey
                    ].valeurs.push(v);
                  }
                }
              }
            }
          }
        });

      this.logger.log(
        `Found related source indicateur valeurs associated to ${
          Object.keys(relatedSourceIndicateurValeursByDate).length
        } collectiviteId/date/sourceId keys to compute ${
          targetIndicateurDefinition.identifiantReferentiel
        } (${targetIndicateurDefinition.id})`
      );

      // For each date get missing indicateur valeurs
      for (const collectiviteIdDateSourceIdKey in relatedSourceIndicateurValeursByDate) {
        const relatedSourceIndicateurInfo =
          relatedSourceIndicateurValeursByDate[collectiviteIdDateSourceIdKey];

        // Check that we have all needed values
        const missingIndicateurIdentifiants = neededSourceIndicateurs
          .filter(
            (neededIndicateur) =>
              !relatedSourceIndicateurInfo.valeurs.find(
                (v) => v.indicateurIdentifiant === neededIndicateur.identifiant
              )
          )
          .map((ind) => ind.identifiant);

        this.logger.log(
          `${
            missingIndicateurIdentifiants.length
          } missing values (identifiants: ${missingIndicateurIdentifiants.join(
            ','
          )}) to compute ${
            targetIndicateurDefinition.identifiantReferentiel
          } (${targetIndicateurDefinition.id}) for collectivite ${
            relatedSourceIndicateurInfo.collectiviteId
          } at date ${relatedSourceIndicateurInfo.date} with sourceId ${
            relatedSourceIndicateurInfo.sourceId
          }`
        );

        relatedSourceIndicateurInfo.missingIdentifiants =
          missingIndicateurIdentifiants;
      }
    }

    return relatedSourceIndicateurValeursByDate;
  }

  private computeCalculatedIndicateurValeur(
    targetIndicateurDefinition: IndicateurDefinition,
    relatedSourceIndicateurValeursByDate: {
      [collectiviteIdDateSourceIdKey: string]: {
        collectiviteId: number;
        valeurs: IndicateurValeurWithIdentifiant[];
        sourceId?: string | null;
        metadonneeId: number | null;
        missingIdentifiants: string[];
        date: string;
      };
    }
  ): IndicateurValeurInsert[] {
    const computedIndicateurValeurs: IndicateurValeurInsert[] = [];

    if (targetIndicateurDefinition.valeurCalcule) {
      this.logger.log(
        `Compute calculated value for ${targetIndicateurDefinition.identifiantReferentiel} (${targetIndicateurDefinition.id})`
      );
      const neededSourceIndicateurs =
        this.indicateurValeurExpressionParserService.extractNeededSourceIndicateursFromFormula(
          targetIndicateurDefinition.valeurCalcule
        );

      // For each date check that we can compute the value
      for (const collectiviteIdDateSourceIdKey in relatedSourceIndicateurValeursByDate) {
        const relatedSourceIndicateurInfo =
          relatedSourceIndicateurValeursByDate[collectiviteIdDateSourceIdKey];

        // Check that we have all needed values
        const missingMandatoryIndicateurIdentifiants = neededSourceIndicateurs
          .filter(
            (neededIndicateur) =>
              !neededIndicateur.optional &&
              !relatedSourceIndicateurInfo.valeurs.find(
                (v) => v.indicateurIdentifiant === neededIndicateur.identifiant
              )
          )
          .map((ind) => ind.identifiant);
        const missingOptionalIndicateurIdentifiants = neededSourceIndicateurs
          .filter(
            (neededIndicateur) =>
              neededIndicateur.optional &&
              !relatedSourceIndicateurInfo.valeurs.find(
                (v) => v.indicateurIdentifiant === neededIndicateur.identifiant
              )
          )
          .map((ind) => ind.identifiant);
        if (missingMandatoryIndicateurIdentifiants.length) {
          this.logger.warn(
            `Missing mandatory values (identifiants: ${missingMandatoryIndicateurIdentifiants.join(
              ','
            )}) to compute ${
              targetIndicateurDefinition.identifiantReferentiel
            } (${targetIndicateurDefinition.id}) for collectivite ${
              relatedSourceIndicateurInfo.collectiviteId
            } at date ${relatedSourceIndicateurInfo.date} with sourceId ${
              relatedSourceIndicateurInfo.sourceId
            }`
          );
        } else {
          this.logger.log(
            `All mandatory values are present to compute ${targetIndicateurDefinition.identifiantReferentiel} (${targetIndicateurDefinition.id}) for collectivite ${relatedSourceIndicateurInfo.collectiviteId} at date ${relatedSourceIndicateurInfo.date} with sourceId ${relatedSourceIndicateurInfo.sourceId}`
          );
          const resultatSourceValues: {
            [indicateurIdentifiant: string]: number | null;
          } = {};
          const objectifSourceValues: {
            [indicateurIdentifiant: string]: number | null;
          } = {};
          // TODO: use in priority value with the same sourceId
          relatedSourceIndicateurInfo.valeurs.forEach((v) => {
            if (v.sourceId === relatedSourceIndicateurInfo.sourceId) {
              this.logger.log(
                `Use source ${v.sourceId} for ${v.indicateurIdentifiant} indicateur values`
              );
              resultatSourceValues[v.indicateurIdentifiant!] = v.resultat;
              objectifSourceValues[v.indicateurIdentifiant!] = v.objectif;
            }
          });
          relatedSourceIndicateurInfo.valeurs.forEach((v) => {
            if (
              isNil(resultatSourceValues[v.indicateurIdentifiant!]) &&
              !isNil(v.resultat)
            ) {
              this.logger.log(
                `Use source ${v.sourceId} for ${v.indicateurIdentifiant} resultat indicateur values`
              );
              resultatSourceValues[v.indicateurIdentifiant!] = v.resultat;
            }

            if (
              isNil(objectifSourceValues[v.indicateurIdentifiant!]) &&
              !isNil(v.objectif)
            ) {
              this.logger.log(
                `Use source ${v.sourceId} for ${v.indicateurIdentifiant} objectif indicateur values`
              );
              objectifSourceValues[v.indicateurIdentifiant!] = v.objectif;
            }
          });

          const atLeastOneResult = Object.values(resultatSourceValues).some(
            (v) => !isNil(v)
          );
          const computedResultat = atLeastOneResult
            ? this.indicateurValeurExpressionParserService.parseAndEvaluateExpression(
                targetIndicateurDefinition.valeurCalcule.toLowerCase(),
                resultatSourceValues
              )
            : null;

          // Check if at least one non null objectif value is present
          // otherwise if only optional values are used in the formuat may result in zero instead of null
          const atLeastOneObjectif = Object.values(objectifSourceValues).some(
            (v) => !isNil(v)
          );
          const computedObjectif = atLeastOneObjectif
            ? this.indicateurValeurExpressionParserService.parseAndEvaluateExpression(
                targetIndicateurDefinition.valeurCalcule.toLowerCase(),
                objectifSourceValues
              )
            : null;

          const indicateurPrecision = !isNil(
            targetIndicateurDefinition.precision
          )
            ? targetIndicateurDefinition.precision
            : CrudValeursService.DEFAULT_ROUNDING_PRECISION;
          const indicateurValeur: IndicateurValeurInsert = {
            collectiviteId: relatedSourceIndicateurInfo.collectiviteId,
            indicateurId: targetIndicateurDefinition.id,
            dateValeur: relatedSourceIndicateurInfo.date,
            resultat: roundTo(computedResultat, indicateurPrecision),
            objectif: roundTo(computedObjectif, indicateurPrecision),
            metadonneeId: relatedSourceIndicateurInfo.metadonneeId,
            calculAuto: true,
            calculAutoIdentifiantsManquants:
              missingOptionalIndicateurIdentifiants,
          };
          computedIndicateurValeurs.push(indicateurValeur);
        }
      }
    }

    return computedIndicateurValeurs;
  }

  private async fetchMissingIndicateurValeurs(
    missingIndicateurValeurs: {
      collectiviteId: number;
      identifiants: string[];
      sourceId?: string | null;
      date: string;
    }[],
    allowedExtraSourcesForCalculatedValues: {
      sourceId: string;
      sourceCalculIds: string[];
    }[]
  ): Promise<IndicateurValeurWithIdentifiant[]> {
    if (!missingIndicateurValeurs.length) {
      return [];
    }

    const condition: (SQLWrapper | SQL)[] = [];
    missingIndicateurValeurs.forEach((missing) => {
      let extraSourceCalculIds = allowedExtraSourcesForCalculatedValues.find(
        (source) =>
          source.sourceId ===
          (missing.sourceId || CrudValeursService.NULL_SOURCE_ID)
      )?.sourceCalculIds;
      if (!extraSourceCalculIds) {
        // Allow to use Insee data for collectivite data
        extraSourceCalculIds = CrudValeursService.DEFAULT_SOURCE_CALCUL_IDS;
      }
      this.logger.log(
        `Search missing values for source ${
          missing.sourceId || CrudValeursService.NULL_SOURCE_ID
        } including allowed extra sources: ${extraSourceCalculIds.join(',')}`
      );

      const missingConditions: (SQLWrapper | SQL)[] = [];
      missingConditions.push(
        eq(indicateurValeurTable.collectiviteId, missing.collectiviteId)
      );
      missingConditions.push(
        eq(indicateurValeurTable.dateValeur, missing.date)
      );
      missingConditions.push(
        inArray(
          indicateurDefinitionTable.identifiantReferentiel,
          missing.identifiants
        )
      );
      if (missing.sourceId) {
        missingConditions.push(
          or(
            eq(indicateurSourceMetadonneeTable.sourceId, missing.sourceId),
            inArray(
              indicateurSourceMetadonneeTable.sourceId,
              extraSourceCalculIds
            )
          )!
        );
      } else {
        missingConditions.push(
          or(
            isNull(indicateurSourceMetadonneeTable.sourceId),
            inArray(
              indicateurSourceMetadonneeTable.sourceId,
              extraSourceCalculIds
            )
          )!
        );
      }
      condition.push(and(...missingConditions)!);
    });

    const result = await this.databaseService.db
      .select({
        ...getTableColumns(indicateurValeurTable),
        indicateurIdentifiant: indicateurDefinitionTable.identifiantReferentiel,
        sourceId: indicateurSourceMetadonneeTable.sourceId,
      })
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
      .where(or(...condition));
    return result;
  }

  private async getSourcesCalcul() {
    const sourceSourceCalculIds = await this.databaseService.db
      .select({
        sourceId: indicateurSourceTable.id,
        sourceCalculIds: sql<
          string[]
        >`array_agg(${indicateurSourceSourceCalculTable.sourceCalculId})`.as(
          'source_calcul_ids'
        ),
      })
      .from(indicateurSourceTable)
      .leftJoin(
        indicateurSourceSourceCalculTable,
        eq(indicateurSourceTable.id, indicateurSourceSourceCalculTable.sourceId)
      )
      .groupBy(indicateurSourceTable.id);
    sourceSourceCalculIds.forEach((source) => {
      if (!source.sourceCalculIds) {
        source.sourceCalculIds = [];
      } else {
        source.sourceCalculIds = source.sourceCalculIds.filter(
          (id) => id !== null
        );
      }
      CrudValeursService.DEFAULT_SOURCE_CALCUL_IDS.forEach(
        (defaultSourceCalculId) => {
          if (!source.sourceCalculIds.includes(defaultSourceCalculId)) {
            source.sourceCalculIds.push(defaultSourceCalculId);
            this.logger.log(
              `Allow to use ${defaultSourceCalculId} to compute ${source.sourceId} indicateur values`
            );
          }
        }
      );
    });
    sourceSourceCalculIds.push({
      sourceId: CrudValeursService.NULL_SOURCE_ID,
      sourceCalculIds: CrudValeursService.DEFAULT_SOURCE_CALCUL_IDS,
    });

    return sourceSourceCalculIds;
  }

  async recomputeAllCalculatedIndicateurValeurs(
    user: AuthUser | null,
    forComputedIndicateurDefinitions?: IndicateurDefinition[],
    doNotCheckRights?: boolean
  ) {
    // Check if the user has the permission to recompute all calculated indicateur valeurs
    if (!doNotCheckRights) {
      this.permissionService.hasServiceRole(user);
    }

    if (!forComputedIndicateurDefinitions) {
      forComputedIndicateurDefinitions =
        await this.indicateurDefinitionService.getComputedIndicateurDefinitions();
    }

    this.logger.log(
      `Recompute all calculated indicateur valeurs for ${
        forComputedIndicateurDefinitions.length
      } computed indicateur definitions: ${forComputedIndicateurDefinitions
        .map((d) => d.identifiantReferentiel)
        .join(',')}`
    );

    const allSourceIdentifiants: string[] = [];
    forComputedIndicateurDefinitions.forEach((computedIndicateurDefinition) => {
      const sourceIdentifiants =
        this.indicateurValeurExpressionParserService.extractNeededSourceIndicateursFromFormula(
          computedIndicateurDefinition.valeurCalcule!
        );
      sourceIdentifiants.forEach((source) => {
        if (!allSourceIdentifiants.includes(source.identifiant)) {
          allSourceIdentifiants.push(source.identifiant);
        }
      });
    });
    this.logger.log(
      `Found ${
        allSourceIdentifiants.length
      } source indicateur identifiants: ${allSourceIdentifiants.join(',')}`
    );

    const allowedExtraSourcesForCalculatedValeurs =
      await this.getSourcesCalcul();

    // Identify all collectivites which have some values for these source identifiants
    const collectiviteIds = (
      await this.databaseService.db
        .selectDistinct({ id: indicateurValeurTable.collectiviteId })
        .from(indicateurValeurTable)
        .leftJoin(
          indicateurDefinitionTable,
          eq(indicateurValeurTable.indicateurId, indicateurDefinitionTable.id)
        )
        .where(
          inArray(
            indicateurDefinitionTable.identifiantReferentiel,
            allSourceIdentifiants
          )
        )
    ).map((c) => c.id);

    const allComputedIndicateurValeurs: {
      collectiviteId: number;
      valeursCount: number;
      identifiants: string[];
    }[] = [];
    const collectiviteIdsChunks = chunk(
      collectiviteIds,
      this.PARALLEL_COLLECTIVITE_COMPUTE_VALEURS
    );
    this.logger.log(
      `Found ${collectiviteIds.length} collectivites with values for these source indicateur identifiants (${collectiviteIdsChunks.length} chunks of ${this.PARALLEL_COLLECTIVITE_COMPUTE_VALEURS} collectivites)`
    );

    const recomputeResult: Promise<{
      collectiviteId: number;
      valeursCount: number;
      identifiants: string[];
    }>[] = [];
    let totalComputedIndicateurValeursCount = 0;
    let iChunk = 0;
    for (const collectiviteIdsChunk of collectiviteIdsChunks) {
      collectiviteIdsChunk.forEach((collectiviteId) => {
        recomputeResult.push(
          this.recomputeCollectiviteCalculatedIndicateurValeurs(
            collectiviteId,
            forComputedIndicateurDefinitions,
            allSourceIdentifiants,
            allowedExtraSourcesForCalculatedValeurs
          )
        );
      });
      const computedIndicateurValeurs = await Promise.all(recomputeResult);
      allComputedIndicateurValeurs.push(...computedIndicateurValeurs);
      computedIndicateurValeurs.forEach((result) => {
        totalComputedIndicateurValeursCount += result.valeursCount;
      });
      iChunk++;
      this.logger.log(
        `Computed ${totalComputedIndicateurValeursCount} indicateur valeurs for ${iChunk}/${collectiviteIdsChunks.length} collectivite chunks`
      );
      recomputeResult.length = 0;
    }

    this.logger.log(
      `${totalComputedIndicateurValeursCount} recomputed indicateur valeurs`
    );

    return allComputedIndicateurValeurs;
  }

  private async recomputeCollectiviteCalculatedIndicateurValeurs(
    collectiviteId: number,
    computedIndicateurDefinitions: IndicateurDefinition[],
    sourceIdentifiants: string[],
    allowedExtraSourcesForCalculatedValues: {
      sourceId: string;
      sourceCalculIds: string[];
    }[]
  ) {
    this.logger.log(
      `Recompute calculated indicateur valeurs for collectivite ${collectiviteId}`
    );

    const sourceValeurs: IndicateurValeurWithIdentifiant[] =
      await this.databaseService.db
        .select({
          ...getTableColumns(indicateurValeurTable),
          indicateurIdentifiant:
            indicateurDefinitionTable.identifiantReferentiel,
          sourceId: indicateurSourceMetadonneeTable.sourceId,
        })
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
        .where(
          and(
            eq(indicateurValeurTable.collectiviteId, collectiviteId),
            inArray(
              indicateurDefinitionTable.identifiantReferentiel,
              sourceIdentifiants
            )
          )
        );
    this.logger.log(
      `Found ${sourceValeurs.length} source indicateur valeurs for collectivite ${collectiviteId}`
    );

    // We don't want top call updateCalculatedIndicateurValeurs because it's looking for missing values: we already have all collectivite values

    const computedIndicateurValeurs: IndicateurValeurInsert[] = [];
    computedIndicateurDefinitions.forEach((computedIndicateurDefinition) => {
      // Fill the map by date
      const relatedSourceIndicateurValeursByDate =
        this.fillRelatedSourceIndicateurValeursByDate(
          computedIndicateurDefinition,
          sourceValeurs,
          allowedExtraSourcesForCalculatedValues,
          {},
          true
        );
      computedIndicateurValeurs.push(
        ...this.computeCalculatedIndicateurValeur(
          computedIndicateurDefinition,
          relatedSourceIndicateurValeursByDate
        )
      );
    });

    // WARNING : can recursively call updateCalculatedIndicateurValeurs if the computed indicateur valeur allows to calcule oher ones
    const insertedIndicateurValeurs: IndicateurValeurWithIdentifiant[] =
      computedIndicateurValeurs.length
        ? await this.upsertIndicateurValeurs(
            computedIndicateurValeurs,
            undefined
          )
        : [];
    const insertedIndicateurValeurIdentifiants = [
      ...new Set(
        insertedIndicateurValeurs
          .map((v) => v.indicateurIdentifiant)
          .filter((v) => v)
      ).values(),
    ] as string[];
    this.logger.log(
      `Inserted ${
        insertedIndicateurValeurs.length
      } computed indicateur valeurs for collectivite ${collectiviteId} and identifiants ${insertedIndicateurValeurIdentifiants.join(
        ','
      )}`
    );
    return {
      valeursCount: insertedIndicateurValeurs.length,
      identifiants: insertedIndicateurValeurIdentifiants,
      collectiviteId,
    };
  }

  private async updateCalculatedIndicateurValeurs(
    updatedSourceIndicateurValeurs: IndicateurValeur[],
    sourceIndicateurDefinitions?: IndicateurDefinition[]
  ): Promise<IndicateurValeur[]> {
    const indicateurIds = [
      ...new Set(updatedSourceIndicateurValeurs.map((v) => v.indicateurId)),
    ];

    if (!sourceIndicateurDefinitions) {
      sourceIndicateurDefinitions =
        await this.indicateurDefinitionService.getIndicateurDefinitions(
          indicateurIds
        );
    } else {
      const missingIds = indicateurIds.filter(
        (id) => !sourceIndicateurDefinitions!.find((d) => d.id === id)
      );
      if (missingIds.length) {
        const missingIndicateurDefinitions =
          await this.indicateurDefinitionService.getIndicateurDefinitions(
            missingIds
          );
        sourceIndicateurDefinitions.push(...missingIndicateurDefinitions);
      }
    }
    const indicateurIdToIdentifiant =
      this.indicateurDefinitionService.getIndicateurIdToIdentifiant(
        sourceIndicateurDefinitions
      );
    const sourceMetadonnees =
      await this.indicateurSourceService.getAllIndicateurSourceMetadonnees();

    const allowedExtraSourcesForCalculatedValeurs =
      await this.getSourcesCalcul();

    const updatedSourceIndicateurValeursAvecIdentifiant =
      updatedSourceIndicateurValeurs as IndicateurValeurWithIdentifiant[];
    updatedSourceIndicateurValeursAvecIdentifiant.forEach((v) => {
      v.indicateurIdentifiant = indicateurIdToIdentifiant[v.indicateurId];
      const sourceMetadonnee = v.metadonneeId
        ? sourceMetadonnees.find((sm) => sm.id === v.metadonneeId)
        : undefined;
      if (sourceMetadonnee) {
        v.sourceId = sourceMetadonnee.sourceId;
      }
    });

    const indicateurIdentifiants = Object.values(indicateurIdToIdentifiant);

    const computedIndicateurDefinitions =
      await this.indicateurDefinitionService.getComputedIndicateurDefinitions(
        indicateurIdentifiants
      );

    if (computedIndicateurDefinitions.length) {
      // Fill the map (used at the end)
      computedIndicateurDefinitions.forEach((def) => {
        if (def.identifiantReferentiel) {
          indicateurIdToIdentifiant[def.id] = def.identifiantReferentiel;
        }
      });

      // Retrieve missing indicateur valeur needed to compute calculated indicateur valeurs
      const allMissingIndicateurValeurs: {
        collectiviteId: number;
        identifiants: string[];
        sourceId?: string | null;
        date: string;
      }[] = [];
      const indicateurRelatedSourceIndicateurValeursByDate: {
        [indicateurDefinitionId: string]: {
          [collectiviteIdDateSourceIdKey: string]: {
            collectiviteId: number;
            valeurs: IndicateurValeurWithIdentifiant[];
            sourceId?: string | null;
            metadonneeId: number | null;
            missingIdentifiants: string[];
            date: string;
          };
        };
      } = {};
      computedIndicateurDefinitions.forEach((computedIndicateurDefinition) => {
        const relatedSourceIndicateurValeursByDate =
          this.fillRelatedSourceIndicateurValeursByDate(
            computedIndicateurDefinition,
            updatedSourceIndicateurValeursAvecIdentifiant,
            allowedExtraSourcesForCalculatedValeurs,
            {},
            true
          );
        indicateurRelatedSourceIndicateurValeursByDate[
          `${computedIndicateurDefinition.id}`
        ] = relatedSourceIndicateurValeursByDate;

        for (const collectiviteIdDateSourceIdKey in relatedSourceIndicateurValeursByDate) {
          const relatedSourceIndicateurInfo =
            relatedSourceIndicateurValeursByDate[collectiviteIdDateSourceIdKey];
          if (relatedSourceIndicateurInfo.missingIdentifiants.length) {
            allMissingIndicateurValeurs.push({
              collectiviteId: relatedSourceIndicateurInfo.collectiviteId,
              identifiants: relatedSourceIndicateurInfo.missingIdentifiants,
              sourceId: relatedSourceIndicateurInfo.sourceId,
              date: relatedSourceIndicateurInfo.date,
            });
          }
        }
      });
      this.logger.log(
        `Need to retrieve missing indicateur valeurs (${allMissingIndicateurValeurs.length} sets) to compute calculated indicateur valeurs`
      );
      const retrievedMissingIndicateurValeurs =
        allMissingIndicateurValeurs.length
          ? await this.fetchMissingIndicateurValeurs(
              allMissingIndicateurValeurs,
              allowedExtraSourcesForCalculatedValeurs
            )
          : [];
      this.logger.log(
        `Retrieved ${retrievedMissingIndicateurValeurs.length} missing indicateur valeurs`
      );

      // Now that we have retrieved all needed values, we can compute the calculated indicateur valeurs
      const computedIndicateurValeurs: IndicateurValeurInsert[] = [];
      computedIndicateurDefinitions.forEach((computedIndicateurDefinition) => {
        // Fill missing retrieved values. We don't want to add new entry in the map but only fill existing ones
        const relatedSourceIndicateurValeursByDate =
          indicateurRelatedSourceIndicateurValeursByDate[
            `${computedIndicateurDefinition.id}`
          ];
        this.fillRelatedSourceIndicateurValeursByDate(
          computedIndicateurDefinition,
          retrievedMissingIndicateurValeurs,
          allowedExtraSourcesForCalculatedValeurs,
          relatedSourceIndicateurValeursByDate,
          false
        );
        computedIndicateurValeurs.push(
          ...this.computeCalculatedIndicateurValeur(
            computedIndicateurDefinition,
            relatedSourceIndicateurValeursByDate
          )
        );
      });

      // WARNING : can recursively call updateCalculatedIndicateurValeurs if the computed indicateur valeur allows to calcule oher ones
      const insertedIndicateurValeurs: IndicateurValeurWithIdentifiant[] =
        computedIndicateurValeurs.length
          ? await this.upsertIndicateurValeurs(
              computedIndicateurValeurs,
              undefined
            )
          : [];
      insertedIndicateurValeurs.forEach((v) => {
        if (!v.indicateurIdentifiant) {
          if (!indicateurIdToIdentifiant[v.indicateurId]) {
            this.logger.warn(
              `Indicateur identifiant for id ${v.indicateurId} not found`
            );
          } else {
            v.indicateurIdentifiant = indicateurIdToIdentifiant[v.indicateurId];
          }
        }
      });

      return insertedIndicateurValeurs;
    }

    return [];
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
          CrudValeursService.NULL_SOURCE_ID
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
    indicateurValeurs: IndicateurValeur[],
    indicateurDefinitions: IndicateurDefinition[],
    commentairesNonInclus = false
  ): IndicateurAvecValeurs[] {
    const initialDefinitionsAcc: {
      [key: string]: IndicateurDefinitionEssential;
    } = {};
    const uniqueIndicateurDefinitions = Object.values(
      indicateurDefinitions.reduce((acc, def) => {
        if (def?.id) {
          const minimaleIndicateurDefinition = _.pick<IndicateurDefinition>(
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
          ) as IndicateurDefinitionEssential;
          acc[def.id.toString()] = minimaleIndicateurDefinition;
        }
        return acc;
      }, initialDefinitionsAcc)
    ) as IndicateurDefinition[];

    const indicateurAvecValeurs = uniqueIndicateurDefinitions.map(
      (indicateurDefinition) => {
        const valeurs = indicateurValeurs
          .filter((v) => v.indicateurId === indicateurDefinition.id)
          .map((v) => {
            const indicateurValeurGroupee: IndicateurValeurGroupee = {
              id: v.id,
              collectiviteId: v.collectiviteId,
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
        const indicateurAvecValeurs: IndicateurAvecValeurs = {
          definition: indicateurDefinition,
          valeurs,
        };
        return indicateurAvecValeurs;
      }
    );
    return indicateurAvecValeurs.filter((i) => i.valeurs.length > 0);
  }

  groupeIndicateursValeursParIndicateurEtSource(
    indicateurValeurs: (IndicateurValeur & { confidentiel: boolean | null })[],
    indicateurDefinitions: IndicateurDefinition[],
    indicateurMetadonnees: SourceMetadonnee[],
    sources: Source[],
    supprimeIndicateursSansValeurs = true
  ): IndicateurAvecValeursParSource[] {
    const initialDefinitionsAcc: { [key: string]: IndicateurDefinition } = {};
    const uniqueIndicateurDefinitions = Object.values(
      indicateurDefinitions.reduce((acc, def) => {
        if (def?.id) {
          acc[def.id.toString()] = def;
        }
        return acc;
      }, initialDefinitionsAcc)
    ) as IndicateurDefinition[];

    const sourcesParId = sources?.length
      ? keyBy(sources, (item) => item.id)
      : {};

    const indicateurAvecValeurs = uniqueIndicateurDefinitions.map(
      (indicateurDefinition) => {
        const valeurs = indicateurValeurs
          .filter((v) => v.indicateurId === indicateurDefinition.id)
          .map((v) => {
            const indicateurValeurGroupee: IndicateurValeurGroupee = {
              id: v.id,
              collectiviteId: v.collectiviteId,
              dateValeur: v.dateValeur,
              resultat: v.resultat,
              resultatCommentaire: v.resultatCommentaire,
              objectif: v.objectif,
              objectifCommentaire: v.objectifCommentaire,
              metadonneeId: v.metadonneeId,
              confidentiel: v.confidentiel,
              calculAuto: v.calculAuto,
              calculAutoIdentifiantsManquants:
                v.calculAutoIdentifiantsManquants,
            };
            return _.omitBy(
              indicateurValeurGroupee,
              _.isNil
            ) as IndicateurValeurGroupee;
          });

        const metadonneesUtilisees: Record<
          string,
          Record<string, SourceMetadonnee>
        > = {};
        const valeursParSource = groupBy(valeurs, (valeur) => {
          if (!valeur.metadonneeId) {
            return CrudValeursService.NULL_SOURCE_ID;
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
            libelle: sourcesParId[sourceId]?.libelle ?? '',
            ordreAffichage: sourcesParId[sourceId]?.ordreAffichage ?? null,
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
