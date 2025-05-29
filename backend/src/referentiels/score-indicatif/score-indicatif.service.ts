import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import {
  indicateurDefinitionTable,
  indicateurSourceMetadonneeTable,
  indicateurSourceTable,
  indicateurValeurTable,
  SourceMetadonnee,
} from '@/backend/indicateurs/index-domain';
import { indicateurActionTable } from '@/backend/indicateurs/shared/models/indicateur-action.table';
import IndicateurExpressionService, {
  EvaluationContext,
} from '@/backend/indicateurs/valeurs/indicateur-expression.service';
import ValeursReferenceService from '@/backend/indicateurs/valeurs/valeurs-reference.service';
import PersonnalisationsService from '@/backend/personnalisations/services/personnalisations-service';
import { actionDefinitionTable } from '@/backend/referentiels/index-domain';
import {
  actionScoreIndicateurValeurTable,
  typeScoreEnum,
} from '@/backend/referentiels/models/action-score-indicateur-valeur.table';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, getTableColumns, isNotNull, sql } from 'drizzle-orm';
import { groupBy } from 'es-toolkit';
import { objectToCamel } from 'ts-case-convert';
import { GetScoreIndicatifRequest } from './get-score-indicatif.request';

type ValeurUtilisee = Awaited<
  ReturnType<ScoreIndicatifService['getIndicateurValeursUtilisees']>
>[number];
type IndicateurAssocie = Awaited<
  ReturnType<ScoreIndicatifService['getIndicateursAssocies']>
>[number];
type TypeScore = ValeurUtilisee['typeScore'];

@Injectable()
export class ScoreIndicatifService {
  private readonly logger = new Logger(ScoreIndicatifService.name);
  private readonly db = this.databaseService.db;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly valeursReferenceService: ValeursReferenceService,
    private readonly collectivitesService: CollectivitesService,
    private readonly personnalisationsService: PersonnalisationsService,
    private readonly indicateurExpressionService: IndicateurExpressionService
  ) {}

  /**
   * Calcule le score indicatif d'une action à partir des indicateurs associés et
   * des valeurs/source/année sélectionnées
   */
  async getScoreIndicatif(input: GetScoreIndicatifRequest) {
    const formule = await this.getFormule(input);
    const exprScore = formule?.[0].exprScore;
    if (!exprScore) {
      this.logger.log(
        `Formule manquante pour le calcul du score indicatif de l'action ${input.actionId}`
      );
      return null;
    }

    const valeursUtilisees = await this.getIndicateurValeursUtilisees(input);
    if (!valeursUtilisees?.length) {
      return null;
    }
    const indicateursAssocies = await this.getIndicateursAssocies(input);
    const evaluationContext = await this.getEvaluationContext(
      input,
      indicateursAssocies
    );

    // groupe les valeurs par type de score (programmé ou fait)
    const valeursParTypeScore = groupBy(valeursUtilisees, (v) => v.typeScore);

    // calcul les scores
    const fait = this.computeScore(
      input,
      exprScore,
      valeursParTypeScore,
      indicateursAssocies,
      typeScoreEnum.FAIT,
      evaluationContext
    );
    const programme = this.computeScore(
      input,
      exprScore,
      valeursParTypeScore,
      indicateursAssocies,
      typeScoreEnum.PROGRAMME,
      evaluationContext
    );

    return {
      fait,
      programme,
    };
  }

  /** Charge la formule à utiliser pour le calcul */
  private async getFormule(input: GetScoreIndicatifRequest) {
    const { actionId, exprScore } = getTableColumns(actionDefinitionTable);

    return this.db
      .select({
        exprScore,
      })
      .from(actionDefinitionTable)
      .where(eq(actionId, input.actionId));
  }

  /** Liste les indicateurs associés à l'action pour le calcul  */
  private getIndicateursAssocies(input: GetScoreIndicatifRequest) {
    const { actionId, indicateurId, utiliseParExprScore } = getTableColumns(
      indicateurActionTable
    );
    const { identifiantReferentiel } = getTableColumns(
      indicateurDefinitionTable
    );

    return this.db
      .select({
        indicateurId: sql<number>`${indicateurId}`,
        identifiantReferentiel: sql<string>`${identifiantReferentiel}`,
      })
      .from(indicateurActionTable)
      .innerJoin(
        indicateurDefinitionTable,
        eq(indicateurDefinitionTable.id, indicateurId)
      )
      .where(
        and(
          eq(actionId, input.actionId),
          eq(utiliseParExprScore, true),
          isNotNull(identifiantReferentiel),
          isNotNull(indicateurId)
        )
      );
  }

  /** Liste les valeurs utilisées pour le calcul */
  private async getIndicateurValeursUtilisees(input: GetScoreIndicatifRequest) {
    const { actionId, collectiviteId, indicateurValeurId, typeScore } =
      getTableColumns(actionScoreIndicateurValeurTable);
    const { indicateurId, dateValeur, resultat, objectif } = getTableColumns(
      indicateurValeurTable
    );

    const valeurs = await this.db
      .select({
        actionId,
        indicateurValeurId,
        typeScore,
        indicateurId,
        dateValeur,
        resultat,
        objectif,
        sourceLibelle: indicateurSourceTable.libelle,
        sourceMetadonnee:
          sql<SourceMetadonnee | null>`to_jsonb(${indicateurSourceMetadonneeTable})`.as(
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
          eq(actionId, input.actionId),
          eq(collectiviteId, input.collectiviteId)
        )
      );

    const valeursNonNulles = objectToCamel(valeurs)
      .map(({ objectif, resultat, ...v }) => ({
        ...v,
        valeur: v.typeScore === typeScoreEnum.FAIT ? resultat : objectif,
      }))
      .filter((v) => v.valeur !== null);

    return valeursNonNulles as Array<
      Omit<(typeof valeursNonNulles)[number], 'valeur'> & { valeur: number }
    >;
  }

  /** Charge les autres données nécessaires au calcul */
  private async getEvaluationContext(
    input: GetScoreIndicatifRequest,
    indicateursAssocies: IndicateurAssocie[]
  ) {
    // charge les données complémentaires
    const collectiviteAvecType =
      await this.collectivitesService.getCollectiviteAvecType(
        input.collectiviteId
      );
    const personnalisationReponses =
      await this.personnalisationsService.getPersonnalisationReponses(
        input.collectiviteId
      );

    // charge les valeurs référence
    const valeursCible: Array<[string, number]> = [];
    const valeursLimite: Array<[string, number]> = [];
    const valeursReference = await Promise.all(
      indicateursAssocies.map(({ indicateurId }) =>
        this.valeursReferenceService.getValeursReference({
          indicateurId,
          collectiviteId: input.collectiviteId,
          collectiviteAvecType,
          personnalisationReponses,
        })
      )
    );
    indicateursAssocies.forEach(({ identifiantReferentiel }, i) => {
      const reference = valeursReference[i];
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
      valeursComplementaires: {
        cible: Object.fromEntries(valeursCible),
        limite: Object.fromEntries(valeursLimite),
      },
      identiteCollectivite: collectiviteAvecType,
      reponses: personnalisationReponses,
    };

    return evaluationContext;
  }

  /** Calcule le score programmé ou fait */
  private computeScore(
    input: GetScoreIndicatifRequest,
    exprScore: string,
    valeursParTypeScore: Record<TypeScore, ValeurUtilisee[]>,
    indicateursAssocies: IndicateurAssocie[],
    typeScore: ValeurUtilisee['typeScore'],
    evaluationContext: EvaluationContext
  ) {
    const valeursUtilisees = valeursParTypeScore[typeScore];
    if (!valeursUtilisees?.length) {
      this.logger.log(
        `Valeur(s) manquante(s) pour le calcul du score indicatif ${typeScore} de l'action ${input.actionId}`
      );
      return null;
    }

    // vérifie que les valeurs requises par le calcul sont disponibles
    const indicateurIdsAvecValeur = valeursUtilisees.map(
      ({ indicateurId }) => indicateurId
    );
    const indicateursAvecValeurManquante = indicateursAssocies.filter(
      ({ indicateurId }) => !indicateurIdsAvecValeur.includes(indicateurId)
    );
    if (indicateursAvecValeurManquante.length) {
      this.logger.log(
        `Valeur(s) manquante(s) pour le calcul du score indicatif ${typeScore} de l'action ${
          input.actionId
        } : ${indicateursAvecValeurManquante.join(',')}`
      );

      return null;
    }

    // indexe les valeurs par identifiant d'indicateur
    const identifiantReferentielParId = Object.fromEntries(
      indicateursAssocies.map(({ indicateurId, identifiantReferentiel }) => [
        indicateurId,
        identifiantReferentiel,
      ])
    );
    const valeursEntries: Array<[string, number]> = [];
    valeursUtilisees.forEach(({ indicateurId, valeur }) => {
      const identifiantReferentiel = identifiantReferentielParId[indicateurId];
      if (identifiantReferentiel)
        valeursEntries.push([identifiantReferentiel, valeur]);
    });
    const valeurs = Object.fromEntries(valeursEntries);

    const score = this.indicateurExpressionService.parseAndEvaluateExpression(
      exprScore,
      valeurs,
      evaluationContext
    );

    const { sourceLibelle, sourceMetadonnee } = valeursUtilisees[0] || {};

    return { score, sourceLibelle, sourceMetadonnee };
  }
}
