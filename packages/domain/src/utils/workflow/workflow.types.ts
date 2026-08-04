export type WorkflowTransitionDef<
  TStatus extends string,
  TGuardId extends string = never
> = {
  from: readonly TStatus[];
  to: TStatus;
  /**
   * Conditions d'application de la transition (état métier, acteur, délais…),
   * évaluées par l'appelant — côté serveur pour faire autorité.
   */
  guards?: readonly TGuardId[];
};

export type WorkflowGuardResults<TGuardId extends string> = Partial<
  Record<TGuardId, boolean>
>;

export type WorkflowTransitionError =
  | 'TRANSITION_NOT_ALLOWED'
  | 'GUARD_NOT_SATISFIED';

export type WorkflowApplyResult<TStatus extends string> =
  | { success: true; data: { toStatus: TStatus } }
  | { success: false; error: WorkflowTransitionError };

export type WorkflowApplyOptions<TGuardId extends string> = {
  guardResults?: WorkflowGuardResults<TGuardId>;
};

export type WorkflowDefinition<
  TStatus extends string,
  TTransition extends string,
  TGuardId extends string = never
> = {
  initialStatus: TStatus;
  transitions: Record<TTransition, WorkflowTransitionDef<TStatus, TGuardId>>;
};

export interface Workflow<
  TStatus extends string,
  TTransition extends string,
  TGuardId extends string = never
> {
  readonly initialStatus: TStatus;
  readonly transitionNames: readonly TTransition[];
  getTransitionDef(
    transition: TTransition
  ): WorkflowTransitionDef<TStatus, TGuardId>;
  /** Vérification structurelle : le statut courant permet-il cette transition ? */
  can(status: TStatus, transition: TTransition): boolean;
  getEnabledTransitions(status: TStatus): TTransition[];
  apply(
    status: TStatus,
    transition: TTransition,
    options?: WorkflowApplyOptions<TGuardId>
  ): WorkflowApplyResult<TStatus>;
}
