import PersonnalisationsService from '@/backend/collectivites/personnalisations/services/personnalisations-service';
import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { categorieTagTable } from '@/backend/collectivites/tags/categorie-tag.table';
import { indicateurCategorieTagTable } from '@/backend/indicateurs/definitions/indicateur-categorie-tag.table';
import { indicateurDefinitionTable } from '@/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@/backend/indicateurs/shared/models/indicateur-source.table';
import CrudValeursService from '@/backend/indicateurs/valeurs/crud-valeurs.service';
import IndicateurExpressionService, {
  EvaluationContext,
} from '@/backend/indicateurs/valeurs/indicateur-expression.service';
import { indicateurValeurTable } from '@/backend/indicateurs/valeurs/indicateur-valeur.table';
import ValeursReferenceService from '@/backend/indicateurs/valeurs/valeurs-reference.service';
import { actionDefinitionTable } from '@/backend/referentiels/models/action-definition.table';
import { actionScoreIndicateurValeurTable } from '@/backend/referentiels/models/action-score-indicateur-valeur.table';
import { GetValeursUtilisablesRequest } from '@/backend/referentiels/score-indicatif/get-valeurs-utilisables.request';
import { SetValeursUtiliseesRequest } from '@/backend/referentiels/score-indicatif/set-valeurs-utilisees.request';
import { AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { CollectiviteAvecType } from '@/domain/collectivites';
import {
  COLLECTIVITE_SOURCE_ID,
  IndicateurAvecValeursParSource,
  IndicateurSourceMetadonnee,
  IndicateurValeurGroupee,
} from '@/domain/indicateurs';
import {
  ActionScoreIndicatif,
  IndicateurAssocie,
  ScoreIndicatifActionValeurUtilisable,
  ScoreIndicatifPayload,
  ScoreIndicatifType,
  scoreIndicatifTypeEnum,
  ValeurUtilisee,
} from '@/domain/referentiels';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, getTableColumns, inArray, not, sql } from 'drizzle-orm';
import { groupBy, keyBy, mapValues, pick } from 'es-toolkit';
import { objectToCamel } from 'ts-case-convert';
import { GetScoreIndicatifRequest } from './get-score-indicatif.request';

@Injectable()
export class ScoreIndicatifService {
  private readonly logger = new Logger(ScoreIndicatifService.name);
  private readonly db = this.databaseService.db;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly valeursReferenceService: ValeursReferenceService,
    private readonly collectivitesService: CollectivitesService,
    private readonly personnalisationsService: PersonnalisationsService,
    private readonly indicateurExpressionService: IndicateurExpressionService,
    private readonly indicateurValeursService: CrudValeursService
  ) {}

  /**
   * Renvoie la liste des valeurs utilisables pour le calcul du score indicatif
   */
  async getValeursUtilisables(
    input: GetValeursUtilisablesRequest,
    user: AuthUser
  ): Promise<ScoreIndicatifActionValeurUtilisable[]> {
    const formules = await this.getFormules(input);
    const { indicateursAssocies } = await this.getIndicateursAssocies({
      ...input,
      formules,
    });

    const indicateurIds = indicateursAssocies.map((ind) => ind.indicateurId);
    if (!indicateurIds.length) {
      this.logger.log(
        `Aucun indicateur trouvé pour les actions ${input.actionIds.join(',')}`
      );
      return [];
    }
    const valeursGroupees =
      await this.indicateurValeursService.getIndicateurValeursGroupees(
        {
          collectiviteId: input.collectiviteId,
          indicateurIds,
        },
        user
      );

    const valeursUtiliseesParActionId =
      await this.getValeursUtiliseesParActionId(input);

    return input.actionIds
      .map((actionId) =>
        this.mapActionIdToValeurUtilisable(
          actionId,
          indicateursAssocies,
          valeursGroupees,
          valeursUtiliseesParActionId
        )
      )
      .filter(
        (indicateursParActionId) => indicateursParActionId.indicateurs.length
      );
  }

  /**
   * Prépare les données pour fournir les valeurs utilisables des indicateurs
   * associés à une action
   */
  private mapActionIdToValeurUtilisable(
    actionId: string,
    indicateursAssocies: IndicateurAssocie[],
    valeursGroupees: { indicateurs: IndicateurAvecValeursParSource[] },
    valeursUtiliseesParActionId: Record<string, ValeurUtilisee[]>
  ): ScoreIndicatifActionValeurUtilisable {
    return {
      actionId,
      indicateurs: indicateursAssocies
        .filter((ind) => ind.actionId === actionId)
        .map((ind) =>
          this.mapIndicateurToValeurUtilisable(
            ind,
            valeursGroupees,
            valeursUtiliseesParActionId[actionId] || []
          )
        )
        .filter((ind): ind is NonNullable<typeof ind> => ind !== null),
    };
  }

  /**
   * Prépare les données pour fournir une valeur utilisable d'un indicateur
   * associé à une action
   */
  private mapIndicateurToValeurUtilisable(
    indicateur: IndicateurAssocie,
    valeursGroupees: { indicateurs: IndicateurAvecValeursParSource[] },
    valeursUtilisees: ValeurUtilisee[]
  ): ScoreIndicatifActionValeurUtilisable['indicateurs'][number] | null {
    const { indicateurId, identifiantReferentiel, unite, titre } = indicateur;
    const sourcesObj = valeursGroupees.indicateurs.find(
      (ind) => ind.definition.id === indicateurId
    )?.sources;

    if (!sourcesObj) return null;

    const valeursUtiliseesParTypeScore = mapValues(
      groupBy(valeursUtilisees, (v) => v.typeScore),
      (valeurs) => valeurs.map((v) => v.indicateurValeurId)
    );

    const selection: Record<
      ScoreIndicatifType,
      {
        id: number;
        annee: number;
        source: string;
        valeur: number;
      } | null
    > = { fait: null, programme: null };

    const transformeValeur = (
      v: IndicateurValeurGroupee,
      typeScore: ScoreIndicatifType,
      source: string
    ) => {
      const utilisee = valeursUtiliseesParTypeScore[typeScore]?.includes(v.id);
      const valeur = (
        typeScore === scoreIndicatifTypeEnum.FAIT ? v.resultat : v.objectif
      ) as number;
      const annee = new Date(v.dateValeur).getFullYear();
      if (utilisee) {
        selection[typeScore] = { id: v.id, annee, source, valeur };
      }
      return {
        id: v.id,
        valeur,
        dateValeur: v.dateValeur,
        annee,
        utilisee,
      };
    };

    const mapValeurs = (
      s: IndicateurAvecValeursParSource['sources'][string],
      typeScore: ScoreIndicatifType
    ) => {
      const field =
        typeScore === scoreIndicatifTypeEnum.FAIT ? 'resultat' : 'objectif';
      return s.valeurs
        .filter((v) => typeof v[field] === 'number')
        .map((v) => transformeValeur(v, typeScore, s.source));
    };

    const getOrdreAffichage = (
      s: IndicateurAvecValeursParSource['sources'][string]
    ) =>
      (s.source === COLLECTIVITE_SOURCE_ID
        ? 0
        : s.ordreAffichage === null
        ? 1000
        : s.ordreAffichage) as number;

    return {
      indicateurId,
      identifiantReferentiel,
      unite,
      titre,
      selection,
      sources: Object.values(sourcesObj)
        .map((s) => ({
          source: s.source,
          libelle: s.source === COLLECTIVITE_SOURCE_ID ? null : s.libelle,
          ordreAffichage: getOrdreAffichage(s),
          fait: mapValeurs(s, scoreIndicatifTypeEnum.FAIT),
          programme: mapValeurs(s, scoreIndicatifTypeEnum.PROGRAMME),
        }))
        .sort((a, b) => a.ordreAffichage - b.ordreAffichage),
    };
  }

  /**
   * Associe ou supprime le lien vers les valeurs utilisées pour le calcul du score indicatif */
  async setValeursUtilisees(input: SetValeursUtiliseesRequest) {
    const { actionId, collectiviteId, indicateurId } = getTableColumns(
      actionScoreIndicateurValeurTable
    );
    await this.db.transaction(async (tx) => {
      await tx
        .delete(actionScoreIndicateurValeurTable)
        .where(
          and(
            eq(actionId, input.actionId),
            eq(collectiviteId, input.collectiviteId),
            eq(indicateurId, input.indicateurId)
          )
        );

      const valeursNonNulles = input.valeurs.filter(
        (v) => v.indicateurValeurId !== null
      );
      if (valeursNonNulles.length) {
        await tx.insert(actionScoreIndicateurValeurTable).values(
          valeursNonNulles.map((v) => ({
            actionId: input.actionId,
            collectiviteId: input.collectiviteId,
            indicateurId: input.indicateurId,
            indicateurValeurId: v.indicateurValeurId as number,
            typeScore: v.typeScore,
          }))
        );
      }
    });
  }

  /**
   * Calcule le score indicatif des actions à partir des indicateurs associés et
   * des valeurs/source/année sélectionnées
   */
  async getScoreIndicatif(
    input: GetScoreIndicatifRequest
  ): Promise<Record<string, ActionScoreIndicatif>> {
    const formules = await this.getFormules(input);

    const valeursUtiliseesParActionId =
      await this.getValeursUtiliseesParActionId(input);

    const { indicateursAssocies, identiteCollectivite } =
      await this.getIndicateursAssocies({ ...input, formules });
    const indicateursAssociesParActionId = groupBy(
      indicateursAssocies,
      ({ actionId }) => actionId
    );

    const evaluationContext = await this.getEvaluationContext(
      input,
      indicateursAssocies,
      identiteCollectivite
    );

    const scoresIndicatifs = formules
      .map(({ actionId, exprScore }) => {
        if (!exprScore) {
          this.logger.log(
            `Formule manquante pour le calcul du score indicatif de l'action ${actionId}`
          );
          return null;
        }

        const indicateurs = indicateursAssociesParActionId[actionId];
        if (!indicateurs?.length) {
          this.logger.log(
            `Indicateurs manquants pour le calcul du score indicatif de l'action ${actionId}`
          );

          return null;
        }

        const valeursUtilisees = valeursUtiliseesParActionId[actionId] || [];
        if (!valeursUtilisees.length) {
          this.logger.log(
            `Valeurs manquantes pour le calcul du score indicatif de l'action ${actionId}`
          );
        }

        // groupe les valeurs par type de score (programmé ou fait)
        const valeursParTypeScore = groupBy(
          valeursUtilisees,
          (v) => v.typeScore
        );

        // calcul les scores
        const fait = this.computeScore(
          actionId,
          exprScore,
          valeursParTypeScore,
          indicateurs,
          scoreIndicatifTypeEnum.FAIT,
          evaluationContext
        );
        const programme = this.computeScore(
          actionId,
          exprScore,
          valeursParTypeScore,
          indicateurs,
          scoreIndicatifTypeEnum.PROGRAMME,
          evaluationContext
        );

        return {
          actionId,
          indicateurs,
          fait,
          programme,
        };
      })
      .filter((score) => !!score);

    return keyBy(scoresIndicatifs, (score) => score.actionId);
  }

  /** Charge les formules à utiliser pour le calcul du score indicatif des actions */
  private async getFormules(input: GetScoreIndicatifRequest) {
    const { actionId, exprScore } = getTableColumns(actionDefinitionTable);

    return this.db
      .select({
        actionId,
        exprScore,
      })
      .from(actionDefinitionTable)
      .where(inArray(actionId, input.actionIds));
  }

  /** Liste les indicateurs associés aux actions pour le calcul du score indicatif  */
  private async getIndicateursAssocies(input: {
    collectiviteId: number;
    formules: { actionId: string; exprScore: string | null }[];
  }) {
    const indicateursParActionId: Record<
      string,
      ReturnType<
        typeof this.indicateurExpressionService.extractNeededSourceIndicateursFromFormula
      >
    > = {};
    const identifiantReferentielList: string[] = [];
    input.formules.forEach(({ actionId, exprScore }) => {
      if (exprScore) {
        const indicateurs =
          this.indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
            exprScore
          );
        indicateursParActionId[actionId] = indicateurs;
        identifiantReferentielList.push(
          ...indicateurs.map((ind) => ind.identifiant)
        );
      }
    });

    const {
      identifiantReferentiel,
      id: indicateurId,
      unite,
      titre,
    } = getTableColumns(indicateurDefinitionTable);

    const indicateurs = await this.db
      .select({
        indicateurId,
        identifiantReferentiel,
        unite,
        titre,
        categories: sql<string[]>`json_agg(${categorieTagTable.nom})`,
      })
      .from(indicateurDefinitionTable)
      .leftJoin(
        indicateurCategorieTagTable,
        eq(indicateurCategorieTagTable.indicateurId, indicateurId)
      )
      .leftJoin(
        categorieTagTable,
        eq(categorieTagTable.id, indicateurCategorieTagTable.categorieTagId)
      )
      .where(and(inArray(identifiantReferentiel, identifiantReferentielList)))
      .groupBy(indicateurId);

    // identité de la collectivité
    const identiteCollectivite =
      await this.collectivitesService.getCollectiviteAvecType(
        input.collectiviteId
      );

    // Cas particulier : certains indicateurs sont propres à la localisation de la collectivité
    const excluded = identiteCollectivite.drom ? 'hors_dom' : 'dom';
    const indicateursFiltres = indicateurs.filter(
      (ind) => !ind.categories.includes(excluded)
    );

    const indicateursAssocies = Object.entries(indicateursParActionId)
      .flatMap(([actionId, actionIndicateurs]) =>
        typeof actionIndicateurs === 'object'
          ? actionIndicateurs
              .map(({ identifiant, optional }) => {
                const indicateur = indicateursFiltres.find(
                  (ind) => ind.identifiantReferentiel === identifiant
                );
                if (!indicateur) {
                  this.logger.log(
                    `Indicateur absent pour l'identifiant ${identifiant} lié à l'action ${actionId}`
                  );
                  return null;
                }
                const { indicateurId, unite, titre } = indicateur;
                return {
                  actionId,
                  indicateurId,
                  unite,
                  titre,
                  identifiantReferentiel: identifiant,
                  optional,
                };
              })
              .filter((ind) => ind !== null)
          : null
      )
      .filter((action) => action !== null);

    return {
      indicateursAssocies,
      identiteCollectivite,
    };
  }

  /** Liste les valeurs d'indicateurs utilisées pour le calcul du score indicatif */
  async getValeursUtiliseesParActionId(input: GetScoreIndicatifRequest) {
    const valeurs = await this.db
      .select({
        actionId: actionScoreIndicateurValeurTable.actionId,
        indicateurValeurId: actionScoreIndicateurValeurTable.indicateurValeurId,
        typeScore: actionScoreIndicateurValeurTable.typeScore,
        indicateurId: actionScoreIndicateurValeurTable.indicateurId,
        dateValeur: indicateurValeurTable.dateValeur,
        resultat: indicateurValeurTable.resultat,
        objectif: indicateurValeurTable.objectif,
        sourceLibelle: indicateurSourceTable.libelle,
        sourceMetadonnee:
          sql<IndicateurSourceMetadonnee | null>`to_jsonb(${indicateurSourceMetadonneeTable})`.as(
            'sourceMetadonnee'
          ),
      })
      .from(actionScoreIndicateurValeurTable)
      .innerJoin(
        indicateurValeurTable,
        eq(
          indicateurValeurTable.id,
          actionScoreIndicateurValeurTable.indicateurValeurId
        )
      )
      .leftJoin(
        indicateurSourceMetadonneeTable,
        eq(
          indicateurSourceMetadonneeTable.id,
          indicateurValeurTable.metadonneeId
        )
      )
      .leftJoin(
        indicateurSourceTable,
        eq(indicateurSourceTable.id, indicateurSourceMetadonneeTable.sourceId)
      )
      .where(
        and(
          inArray(actionScoreIndicateurValeurTable.actionId, input.actionIds),
          eq(
            actionScoreIndicateurValeurTable.collectiviteId,
            input.collectiviteId
          )
        )
      );

    const valeursNonNulles = objectToCamel(valeurs)
      .map(({ objectif, resultat, ...v }) => ({
        ...v,
        valeur: (v.typeScore === scoreIndicatifTypeEnum.FAIT
          ? resultat
          : objectif) as number,
      }))
      .filter((v) => v.valeur !== null);

    return groupBy(
      valeursNonNulles,
      ({ actionId }: { actionId: string }) => actionId
    );
  }

  /** Charge et agrège les données nécessaires au calcul */
  private async getEvaluationContext(
    input: GetScoreIndicatifRequest,
    indicateursAssocies: IndicateurAssocie[],
    identiteCollectivite: CollectiviteAvecType
  ) {
    // réponses aux questions de personnalisation
    const personnalisationReponses =
      await this.personnalisationsService.getPersonnalisationReponses(
        input.collectiviteId
      );

    // valeurs de référence (cible/limite)
    const valeursCible: Array<[string, number]> = [];
    const valeursLimite: Array<[string, number]> = [];
    const indicateurIds = indicateursAssocies.map(
      ({ indicateurId }) => indicateurId
    );
    const valeursReference =
      await this.valeursReferenceService.getValeursReference({
        indicateurIds,
        collectiviteId: input.collectiviteId,
        collectiviteAvecType: identiteCollectivite,
        personnalisationReponses,
      });
    indicateursAssocies.forEach(({ identifiantReferentiel }) => {
      const reference = valeursReference.find(
        (v) => v?.identifiantReferentiel === identifiantReferentiel
      );
      if (reference && identifiantReferentiel) {
        if (reference.cible !== null) {
          valeursCible.push([identifiantReferentiel, reference.cible]);
        }
        if (reference.seuil !== null) {
          valeursLimite.push([identifiantReferentiel, reference.seuil]);
        }
      }
    });

    const evaluationContext: EvaluationContext = {
      identiteCollectivite,
      reponses: personnalisationReponses,
      valeursComplementaires: {
        cible: Object.fromEntries(valeursCible),
        limite: Object.fromEntries(valeursLimite),
      },
    };

    return evaluationContext;
  }

  /** Calcule le score programmé ou fait */
  private computeScore(
    actionId: string,
    exprScore: string,
    valeursParTypeScore: Record<ScoreIndicatifType, ValeurUtilisee[]>,
    indicateursAssocies: IndicateurAssocie[],
    typeScore: ScoreIndicatifType,
    evaluationContext: EvaluationContext
  ) {
    const valeursUtilisees = valeursParTypeScore[typeScore] || [];

    // Si aucune valeur présente, log et retourne null
    if (valeursUtilisees.length === 0) {
      this.logger.log(
        `Valeur(s) manquante(s) pour le calcul du score indicatif ${typeScore} de l'action ${actionId}`
      );
      return null;
    }

    const identifiantReferentielParId = Object.fromEntries(
      indicateursAssocies.map(({ indicateurId, identifiantReferentiel }) => [
        indicateurId,
        identifiantReferentiel,
      ])
    );

    const valeurs = Object.fromEntries(
      valeursUtilisees
        .map(({ indicateurId, valeur }) => {
          const identifiant = identifiantReferentielParId[indicateurId];
          return identifiant ? [identifiant, valeur] : null;
        })
        .filter(Boolean) as [string, number][]
    );

    const score = this.indicateurExpressionService.parseAndEvaluateExpression(
      exprScore,
      valeurs,
      evaluationContext
    );
    if (score === null) {
      this.logger.log(
        `Le score indicatif ${typeScore} de l'action ${actionId} n'a pas pû être calculé`
      );
      return null;
    }

    return {
      score,
      valeursUtilisees: valeursUtilisees.map((val) =>
        pick(val, [
          'valeur',
          'dateValeur',
          'sourceLibelle',
          'sourceMetadonnee',
          'indicateurId',
        ])
      ),
    };
  }

  /**
   * Calcule et formate les scores indicatifs pour toutes les actions ayant une formule
   * @param input Les paramètres de la requête
   * @returns Les scores indicatifs au format attendu pour le snapshot
   */
  async getScoresIndicatifsForPayload(
    collectiviteId: number
  ): Promise<Array<{ actionId: string; score: ScoreIndicatifPayload }>> {
    const actionIds = await this.extractActionIdsWithExprScore();
    if (!actionIds.length) return [];
    const scores = await this.getScoreIndicatif({ collectiviteId, actionIds });
    return Object.entries(scores)
      .map(([actionId, score]) => ({
        actionId,
        score: this.formatScoreIndicatifForPayload(score),
      }))
      .filter(({ score }) => score.fait || score.programme);
  }

  /**
   * Extrait tous les identifiants d'actions pour lesquelles il y a une formule
   * permettant de calculer un score indicatif
   */
  private async extractActionIdsWithExprScore() {
    const rows = await this.db
      .select({
        actionId: actionDefinitionTable.actionId,
      })
      .from(actionDefinitionTable)
      .where(not(eq(actionDefinitionTable.exprScore, '')));
    return rows.map((r) => r.actionId);
  }

  /**
   * Formate un score indicatif pour l'inclure dans le payload du snapshot
   * @param score Le score indicatif à formater
   * @returns Le score au format ScoreIndicatifPayload
   */
  private formatScoreIndicatifForPayload(
    scoreIndicatif: ActionScoreIndicatif
  ): ScoreIndicatifPayload {
    return {
      unite: scoreIndicatif.indicateurs?.[0].unite,
      fait: this.formatValeursForPayload(
        scoreIndicatif,
        scoreIndicatifTypeEnum.FAIT
      ),
      programme: this.formatValeursForPayload(
        scoreIndicatif,
        scoreIndicatifTypeEnum.PROGRAMME
      ),
    };
  }

  private formatValeursForPayload(
    scoreIndicatif: ActionScoreIndicatif,
    typeScore: ScoreIndicatifType
  ) {
    const scoreData = scoreIndicatif[typeScore];
    if (!scoreData) return null;

    return {
      score: scoreData.score,
      valeursUtilisees: scoreData.valeursUtilisees.map(
        ({ sourceMetadonnee, ...valeur }) => ({
          ...pick(valeur, [
            'indicateurId',
            'valeur',
            'dateValeur',
            'sourceLibelle',
          ]),
          sourceMetadonnee: sourceMetadonnee
            ? pick(sourceMetadonnee, ['sourceId', 'dateVersion'])
            : null,
          identifiantReferentiel:
            scoreIndicatif.indicateurs.find(
              (ind) => ind.indicateurId === valeur.indicateurId
            )?.identifiantReferentiel || '',
        })
      ),
    };
  }
}
