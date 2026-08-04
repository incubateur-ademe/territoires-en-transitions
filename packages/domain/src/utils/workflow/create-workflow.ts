import type {
  Workflow,
  WorkflowApplyOptions,
  WorkflowApplyResult,
  WorkflowDefinition,
  WorkflowTransitionDef,
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

  const getEnabledTransitions = (status: TStatus): TTransition[] =>
    transitionNames.filter((transition) => can(status, transition));

  const apply = (
    status: TStatus,
    transition: TTransition,
    options?: WorkflowApplyOptions<TGuardId>
  ): WorkflowApplyResult<TStatus> => {
    if (!can(status, transition)) {
      return { success: false, error: 'TRANSITION_NOT_ALLOWED' };
    }

    // Fail-closed : un guard déclaré sans résultat explicitement vrai bloque.
    const definitionGuards = getTransitionDef(transition).guards ?? [];
    const guardsSatisfied = definitionGuards.every(
      (guard) => options?.guardResults?.[guard] === true
    );
    if (!guardsSatisfied) {
      return { success: false, error: 'GUARD_NOT_SATISFIED' };
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
    getEnabledTransitions,
    apply,
  };
};
