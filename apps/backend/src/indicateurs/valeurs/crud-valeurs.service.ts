import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { indicateurCollectiviteTable } from '@/backend/indicateurs/shared/models/indicateur-collectivite.table';
import ComputeValeursService from '@/backend/indicateurs/valeurs/compute-valeurs.service';
import {
  DEFAULT_ROUNDING_PRECISION,
  NULL_SOURCE_ID,
} from '@/backend/indicateurs/valeurs/valeurs.constants';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { getISOFormatDateQuery } from '@/backend/utils/column.utils';
import { buildConflictUpdateColumns } from '@/backend/utils/database/conflict.utils';
import { getErrorMessage } from '@/backend/utils/nest/errors.utils';
import { roundTo } from '@/backend/utils/number.utils';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
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
import {
  chunk,
  groupBy,
  isNil,
  isNotNil,
  keyBy,
  omit,
  partition,
} from 'es-toolkit';
import * as _ from 'lodash';
import {
  AuthenticatedUser,
  AuthRole,
  AuthUser,
} from '../../users/models/auth.models';
import { DatabaseService } from '../../utils/database/database.service';
import { ListDefinitionsService } from '../list-definitions/list-definitions.service';
import { DeleteIndicateursValeursRequestType } from '../shared/models/delete-indicateurs.request';
import { DeleteValeurIndicateur } from '../shared/models/delete-valeur-indicateur.request';
import { GetIndicateursValeursInputType } from '../shared/models/get-indicateurs.input';
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
  indicateurSourceTable,
  Source,
} from '../shared/models/indicateur-source.table';
import {
  IndicateurAvecValeurs,
  IndicateurAvecValeursParSource,
  IndicateurValeur,
  IndicateurValeurAvecMetadonnesDefinition,
  IndicateurValeurGroupee,
  IndicateurValeurInsert,
  IndicateurValeursGroupeeParSource,
  indicateurValeurTable,
  IndicateurValeurWithIdentifiant,
} from '../shared/models/indicateur-valeur.table';
import { UpsertValeurIndicateur } from '../shared/models/upsert-valeur-indicateur.request';

@Injectable()
export default class CrudValeursService {
  private readonly logger = new Logger(CrudValeursService.name);

  /**
   * Quand la sourceId est NULL, cela signifie que ce sont des donnees saisies par la collectivite
   */
  static NULL_SOURCE_ID = NULL_SOURCE_ID;
  static NULL_SOURCE_LABEL = 'saisie manuelle';

  public readonly UNKOWN_SOURCE_ID = 'unknown';

  private readonly PARALLEL_COLLECTIVITE_COMPUTE_VALEURS = 1;

  /**
   * Number of decimal in order to round the value
   */
  static DEFAULT_ROUNDING_PRECISION = DEFAULT_ROUNDING_PRECISION;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly collectiviteService: CollectivitesService,
    private readonly indicateurDefinitionService: ListDefinitionsService,
    private readonly computeValeursService: ComputeValeursService
  ) {}

  private getIndicateurValeursSqlConditions(
    options: GetIndicateursValeursInputType
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
  async getIndicateursValeurs(
    options: GetIndicateursValeursInputType,
    ignoreDedoublonnage?: boolean
  ) {
    this.logger.log(
      `Récupération des valeurs des indicateurs selon ces options : ${JSON.stringify(
        options
      )}`
    );

    const conditions = this.getIndicateurValeursSqlConditions(options);

    let result: IndicateurValeurAvecMetadonnesDefinition[] =
      await this.databaseService.db
        .select({
          indicateur_valeur: {
            ...omit(getTableColumns(indicateurValeurTable), [
              'createdAt',
              'modifiedAt',
            ]),
            createdAt: getISOFormatDateQuery(indicateurValeurTable.createdAt),
            modifiedAt: getISOFormatDateQuery(indicateurValeurTable.modifiedAt),
          },
          indicateur_definition: {
            ...omit(getTableColumns(indicateurDefinitionTable), [
              'createdAt',
              'modifiedAt',
            ]),
            createdAt: getISOFormatDateQuery(
              indicateurDefinitionTable.createdAt
            ),
            modifiedAt: getISOFormatDateQuery(
              indicateurDefinitionTable.modifiedAt
            ),
          },
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
    if (!ignoreDedoublonnage) {
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
    options: GetIndicateursValeursInputType,
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
        PermissionOperationEnum['INDICATEURS.LECTURE'],
        ResourceType.COLLECTIVITE,
        collectiviteId,
        true
      );
      const hasPermissionVisite = await this.permissionService.isAllowed(
        tokenInfo,
        PermissionOperationEnum['INDICATEURS.VISITE'],
        ResourceType.COLLECTIVITE,
        collectiviteId,
        true
      );
      const accesRestreintRequis = collectivitePrivate && !hasPermissionLecture;
      if (accesRestreintRequis || !hasPermissionVisite) {
        throw new ForbiddenException(
          `Droits insuffisants, l'utilisateur ${
            tokenInfo.id
          } n'a pas l'autorisation ${
            accesRestreintRequis
              ? PermissionOperationEnum['INDICATEURS.LECTURE']
              : PermissionOperationEnum['INDICATEURS.VISITE']
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
      .select({
        ...omit(getTableColumns(indicateurDefinitionTable), [
          'createdAt',
          'modifiedAt',
        ]),
        createdAt: getISOFormatDateQuery(indicateurDefinitionTable.createdAt),
        modifiedAt: getISOFormatDateQuery(indicateurDefinitionTable.modifiedAt),
      })
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
      PermissionOperationEnum['INDICATEURS.EDITION'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(`Usert valeur with data ${JSON.stringify(data)}`);

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
        const calculatedIndicateurValeurToUpsert =
          await this.computeValeursService.updateCalculatedIndicateurValeurs(
            [upsertedIndicateurValeur],
            [indicateurDefinition]
          );
        this.logger.log(
          `${calculatedIndicateurValeurToUpsert.length} valeurs d'indicateurs calculées`
        );

        // WARNING : can recursively call updateCalculatedIndicateurValeurs if the computed indicateur valeur allows to calcule oher ones
        const calculatedIndicateurValeur: IndicateurValeurWithIdentifiant[] =
          calculatedIndicateurValeurToUpsert.length
            ? await this.upsertIndicateurValeurs(
                calculatedIndicateurValeurToUpsert,
                undefined
              )
            : [];
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
      PermissionOperationEnum['INDICATEURS.EDITION'],
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
    tokenInfo: AuthenticatedUser | undefined,
    disableCalculAuto?: boolean
  ): Promise<IndicateurValeurWithIdentifiant[]> {
    const collectiviteIds = [
      ...new Set(indicateurValeurs.map((v) => v.collectiviteId)),
    ];
    if (tokenInfo) {
      for (const collectiviteId of collectiviteIds) {
        await this.permissionService.isAllowed(
          tokenInfo,
          PermissionOperationEnum['INDICATEURS.EDITION'],
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
        v.resultat = isNotNil(v.resultat)
          ? roundTo(v.resultat, definition.precision)
          : null;
        v.objectif = isNotNil(v.objectif)
          ? roundTo(v.objectif, definition.precision)
          : null;
      } else {
        throw new BadRequestException(
          `Indicateur definition not found for id ${v.indicateurId}`
        );
      }
    });

    // On doit distinguer les valeurs avec et sans métadonnées car la clause d'unicité est différente (onConflictDoUpdate)
    const [indicateurValeursAvecMetadonnees, indicateurValeursSansMetadonnees] =
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

    if (indicateurValeursResultat.length && !disableCalculAuto) {
      const calculatedIndicateursResultatToUpsert =
        await this.computeValeursService.updateCalculatedIndicateurValeurs(
          indicateurValeursResultat
        );
      this.logger.log(
        `${calculatedIndicateursResultatToUpsert.length} valeurs d'indicateurs calculées`
      );

      const calculatedIndicateurValeur: IndicateurValeurWithIdentifiant[] =
        calculatedIndicateursResultatToUpsert.length
          ? await this.upsertIndicateurValeurs(
              calculatedIndicateursResultatToUpsert,
              undefined
            )
          : [];

      indicateurValeursResultat.push(...calculatedIndicateurValeur);
    }

    return indicateurValeursResultat;
  }

  async recomputeAllCalculatedIndicateurValeurs(
    onlyForCollectiviteId: number | undefined,
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
      `Recompute all calculated indicateur valeurs for collectivite ${
        onlyForCollectiviteId || 'all'
      } and identifiants ${forComputedIndicateurDefinitions
        .map((d) => d.identifiantReferentiel)
        .join(',')}`
    );

    const allSourceIdentifiants =
      await this.computeValeursService.getAllSourceIdentifiants(
        forComputedIndicateurDefinitions
      );

    const allowedExtraSourcesForCalculatedValeurs =
      await this.computeValeursService.getSourcesCalcul();

    // Identify all collectivites which have some values for these source identifiants

    const collectiviteIds = onlyForCollectiviteId
      ? [onlyForCollectiviteId]
      : (
          await this.databaseService.db
            .selectDistinct({ id: indicateurValeurTable.collectiviteId })
            .from(indicateurValeurTable)
            .leftJoin(
              indicateurDefinitionTable,
              eq(
                indicateurValeurTable.indicateurId,
                indicateurDefinitionTable.id
              )
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
    computedIndicateurDefinitions: IndicateurDefinition[] | undefined,
    sourceIdentifiants: string[],
    allowedExtraSourcesForCalculatedValues: {
      sourceId: string;
      sourceCalculIds: string[];
    }[]
  ) {
    this.logger.log(
      `Recompute calculated indicateur valeurs for collectivite ${collectiviteId}`
    );

    if (!computedIndicateurDefinitions) {
      computedIndicateurDefinitions =
        await this.indicateurDefinitionService.getComputedIndicateurDefinitions();
    }

    const computedIndicateurValeurs =
      await this.computeValeursService.recomputeCollectiviteCalculatedIndicateurValeurs(
        collectiviteId,
        computedIndicateurDefinitions,
        sourceIdentifiants,
        allowedExtraSourcesForCalculatedValues
      );

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
    indicateurValeurs: (IndicateurValeur & { confidentiel?: boolean | null })[],
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
              calculAuto: v.calculAuto ? v.calculAuto : undefined,
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
