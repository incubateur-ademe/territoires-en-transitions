import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import PersonnalisationsExpressionService from '@tet/backend/collectivites/personnalisations/services/personnalisations-expression.service';
import PersonnalisationsService from '@tet/backend/collectivites/personnalisations/services/personnalisations-service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type {
  IdentiteCollectivite,
  PersonnalisationReponsesPayload,
} from '@tet/domain/collectivites';

/**
 * De quoi évaluer les conditions d'assujettissement d'un catalogue. Chargé une
 * fois par lecture, et seulement si au moins une pièce est conditionnelle.
 */
export type DemarcheDocumentApplicabiliteContext = {
  identiteCollectivite: IdentiteCollectivite;
  reponses: PersonnalisationReponsesPayload | null;
};

/**
 * Décide si une pièce du catalogue concerne une collectivité donnée.
 *
 * La condition est une expression stockée en base, dans le même langage que les
 * règles de personnalisation : `identite(population, plus_de_45000)`,
 * `reponse(PPA, OUI)`, `et` / `ou`, `si … alors … sinon`. Une pièce non
 * applicable n'est pas servie du tout — ni affichée, ni comptée dans la
 * complétude du dossier.
 */
@Injectable()
export class DemarcheDocumentApplicabiliteService {
  private readonly logger = new Logger(
    DemarcheDocumentApplicabiliteService.name
  );

  constructor(
    private readonly collectivitesService: CollectivitesService,
    private readonly expressionService: PersonnalisationsExpressionService,
    private readonly personnalisationsService: PersonnalisationsService
  ) {}

  /**
   * Charge le strict nécessaire à l'évaluation : l'identité de la collectivité,
   * et ses réponses de personnalisation seulement si une expression en
   * référence — les réponses effectives coûtent une union de trois tables
   * jointe aux compétences BANATIC, à ne pas payer à chaque lecture de dossier.
   */
  async loadContext(
    collectiviteId: number,
    expressions: readonly string[],
    tx?: Transaction
  ): Promise<DemarcheDocumentApplicabiliteContext> {
    const identiteCollectivite =
      await this.collectivitesService.getCollectiviteAvecType(collectiviteId);

    const reponses = this.needsReponses(expressions)
      ? await this.personnalisationsService.getPersonnalisationReponses(
          collectiviteId,
          undefined,
          undefined,
          tx
        )
      : null;

    return { identiteCollectivite, reponses };
  }

  /**
   * Une pièce sans condition concerne tout le monde. Une condition illisible
   * la laisse dans le catalogue, avec une erreur journalisée : masquer une
   * pièce requise rendrait le dossier faussement complet et laisserait
   * transmettre un dossier incomplet, alors qu'une pièce affichée à tort bloque
   * la transmission de façon visible.
   */
  isApplicable(
    exprApplicable: string | null,
    context: DemarcheDocumentApplicabiliteContext | null
  ): boolean {
    const expression = exprApplicable?.trim();
    if (!expression) {
      return true;
    }
    if (!context) {
      this.logger.error(
        `Condition d'assujettissement non évaluable, pièce conservée : contexte absent pour « ${expression} »`
      );
      return true;
    }

    try {
      const resultat = this.expressionService.parseAndEvaluateExpression(
        expression,
        {
          reponses: context.reponses,
          identiteCollectivite: context.identiteCollectivite,
        }
      );
      // Égalité stricte : le visiteur peut rendre un nombre, null, ou une
      // chaîne. Tout ce qui n'est ni vrai ni faux est une condition cassée.
      if (resultat === true || resultat === false) {
        return resultat;
      }
      this.logger.error(
        `Condition d'assujettissement non booléenne, pièce conservée : « ${expression} » a rendu ${JSON.stringify(
          resultat
        )}`
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Condition d'assujettissement invalide, pièce conservée : « ${expression} »`,
        error
      );
      return true;
    }
  }

  /** Une expression a-t-elle besoin des réponses de personnalisation ? */
  private needsReponses(expressions: readonly string[]): boolean {
    return expressions.some((expression) => {
      try {
        return (
          Object.keys(
            this.expressionService.extractNeededQuestionsFromExpression(
              expression
            )
          ).length > 0
        );
      } catch {
        // Expression illisible : `isApplicable` la signalera, inutile de
        // charger les réponses pour elle.
        return false;
      }
    });
  }
}
