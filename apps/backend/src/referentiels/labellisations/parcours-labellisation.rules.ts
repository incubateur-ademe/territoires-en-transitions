import {
  ActionScoreFinal,
  Etoile,
  EtoileActionConditionDefinition,
  EtoileEnum,
  findActionById,
  getParentId,
  getScoreRatios,
  LabellisationEtoileDefinition,
  ParcoursLabellisation,
  StatutAvancementEnum,
  toReponseAttendue,
} from '@tet/domain/referentiels';

type ActionConditionDefinition = Omit<
  EtoileActionConditionDefinition,
  'minRealiseScore' | 'minProgrammeScore'
>;

type ActionScoresTree = {
  actionId: string;
  actionsEnfant: ActionScoresTree[];
  score: ActionScoreFinal;
};

export class ParcoursLabellisationRules {
  static getEtoileCible({
    etoilesDefinitions,
    currentEtoile = EtoileEnum.PREMIERE_ETOILE,
    nextEtoile = EtoileEnum.PREMIERE_ETOILE,
    scoreFait,
    etoileVisee,
  }: {
    etoilesDefinitions: readonly LabellisationEtoileDefinition[];
    currentEtoile: number | undefined;
    nextEtoile: number | undefined;
    scoreFait: number | null | undefined;
    etoileVisee: Etoile | undefined;
  }) {
    // Les définitions sont chargées par seuil décroissant.
    const maxEligibleEtoile = scoreFait
      ? etoilesDefinitions.find((etoile) => etoile.minRealiseScore <= scoreFait)
          ?.etoile ?? EtoileEnum.PREMIERE_ETOILE
      : EtoileEnum.PREMIERE_ETOILE;

    const nbEtoilesCibles =
      etoileVisee ??
      (Math.max(
        currentEtoile,
        nextEtoile,
        maxEligibleEtoile,
        EtoileEnum.PREMIERE_ETOILE
      ) as Etoile);

    const etoileCible = etoilesDefinitions.find(
      (etoile) => etoile.etoile === nbEtoilesCibles
    );

    if (!etoileCible) {
      throw new Error(`Étoile cible ${nbEtoilesCibles} introuvable`);
    }

    return etoileCible;
  }

  static buildCriteresAction({
    actionScoresTree,
    actionConditionDefinitions,
  }: {
    actionScoresTree: ActionScoresTree;
    actionConditionDefinitions: readonly ActionConditionDefinition[];
  }): ParcoursLabellisation['criteresAction'] {
    return actionConditionDefinitions
      .map((condition) => this.buildActionCritere(actionScoresTree, condition))
      .filter((critere) => critere !== null);
  }

  /** Équivalent de la fonction PG `labellisation.critere_action()`. */
  private static buildActionCritere(
    actionScoresTree: ActionScoresTree,
    actionCondition: ActionConditionDefinition
  ) {
    const action = findActionById(actionScoresTree, actionCondition.actionId);

    const actionScore = {
      ...action.score,
      ...getScoreRatios(action.score),
    };

    // Automatique non concerné (par la personnalisation) > ne doit pas être affiché
    if (action.score.desactive) {
      return null;
    }

    const actionSatisfyRatioFait =
      actionScore.ratioFait * 100 >= actionCondition.minRealisePercentage;

    const actionSatisfyRatioFaitPlusProgramme =
      actionCondition.minProgrammePercentage !== null &&
      (actionScore.ratioFait + actionScore.ratioProgramme) * 100 >=
        actionCondition.minProgrammePercentage;

    const parent = findActionById(
      actionScoresTree,
      getParentId({ actionId: actionCondition.actionId }) as string
    );

    const parentScore = {
      ...parent.score,
      ...getScoreRatios(parent.score),
    };

    const parentSatisfyRatioFait =
      parentScore.ratioFait * 100 >= actionCondition.minRealisePercentage;

    const parentSatisfyRatioFaitPlusProgramme =
      actionCondition.minProgrammePercentage !== null &&
      (parentScore.ratioFait + parentScore.ratioProgramme) * 100 >=
        actionCondition.minProgrammePercentage;

    const isConditionSatisfied =
      parent.score.concerne &&
      parent.score.avancement &&
      parent.score.avancement !== StatutAvancementEnum.NON_RENSEIGNE
        ? parentSatisfyRatioFait || parentSatisfyRatioFaitPlusProgramme
        : actionSatisfyRatioFait || actionSatisfyRatioFaitPlusProgramme;

    return {
      ...actionCondition,
      atteint: isConditionSatisfied,
      proportionFait: actionScore.ratioFait,
      proportionProgramme: actionScore.ratioProgramme,
      reponseAttendue: toReponseAttendue({
        referentiel: actionCondition.referentielId,
        actionId: actionCondition.actionId,
        minRealisePercentage: actionCondition.minRealisePercentage,
        minProgrammePercentage: actionCondition.minProgrammePercentage,
      }),
    };
  }
}
