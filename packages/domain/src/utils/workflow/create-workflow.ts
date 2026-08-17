import type {
  Workflow,
  WorkflowApplyOptions,
  WorkflowApplyResult,
  WorkflowDefinition,
  WorkflowEvaluation,
  WorkflowGuardResults,
  WorkflowTransitionDef,
  WorkflowTransitionEvaluation,
} from './workflow.types';

export const createWorkflow = <
  TStatus extends string,
  TTransition extends string,
  TGuardId extends string = never
>(
  definition: WorkflowDefinition<TStatus, TTransition, TGuardId>
): Workflow<TStatus, TTransition, TGuardId> => {
  const transitionNames = Object.keys(definition.transitions) as TTransition[];

  const getTransitionDef = (
    transition: TTransition
  ): WorkflowTransitionDef<TStatus, TGuardId> =>
    definition.transitions[transition];

  const can = (status: TStatus, transition: TTransition): boolean =>
    getTransitionDef(transition).from.includes(status);

  const getReachableTransitions = (status: TStatus): TTransition[] =>
    transitionNames.filter((transition) => can(status, transition));

  /**
   * Guards dont dépend au moins une transition partant de ce statut : c'est
   * exactement ce qu'un appelant a besoin d'évaluer, donc de lire en base.
   */
  const getRequiredGuards = (status: TStatus): TGuardId[] => [
    ...new Set(
      getReachableTransitions(status).flatMap(
        (transition) => getTransitionDef(transition).guards ?? []
      )
    ),
  ];

  const evaluateTransition = (
    status: TStatus,
    transition: TTransition,
    guardResults?: WorkflowGuardResults<TGuardId>
  ): WorkflowTransitionEvaluation<TGuardId> => {
    const reachable = can(status, transition);
    // Fail-closed : un guard déclaré sans résultat explicitement vrai bloque.
    const blockedBy = reachable
      ? (getTransitionDef(transition).guards ?? []).filter(
          (guard) => guardResults?.[guard] !== true
        )
      : [];
    return {
      reachable,
      enabled: reachable && blockedBy.length === 0,
      blockedBy,
    };
  };

  const evaluate = (
    status: TStatus,
    guardResults?: WorkflowGuardResults<TGuardId>
  ): WorkflowEvaluation<TTransition, TGuardId> =>
    Object.fromEntries(
      transitionNames.map((transition) => [
        transition,
        evaluateTransition(status, transition, guardResults),
      ])
    ) as WorkflowEvaluation<TTransition, TGuardId>;

  const apply = (
    status: TStatus,
    transition: TTransition,
    options?: WorkflowApplyOptions<TGuardId>
  ): WorkflowApplyResult<TStatus, TGuardId> => {
    const { reachable, enabled, blockedBy } = evaluateTransition(
      status,
      transition,
      options?.guardResults
    );
    if (!reachable) {
      return { success: false, error: 'TRANSITION_NOT_ALLOWED', blockedBy };
    }
    if (!enabled) {
      return { success: false, error: 'GUARD_NOT_SATISFIED', blockedBy };
    }

    return {
      success: true,
      data: { toStatus: getTransitionDef(transition).to },
    };
  };

  return {
    initialStatus: definition.initialStatus,
    transitionNames,
    getTransitionDef,
    can,
    getReachableTransitions,
    getRequiredGuards,
    evaluate,
    apply,
  };
};

/** Transitions applicables ici et maintenant, extraites d'une évaluation. */
export const listEnabledTransitions = <
  TTransition extends string,
  TGuardId extends string
>(
  evaluation: WorkflowEvaluation<TTransition, TGuardId>
): TTransition[] =>
  (Object.keys(evaluation) as TTransition[]).filter(
    (transition) => evaluation[transition].enabled
  );
