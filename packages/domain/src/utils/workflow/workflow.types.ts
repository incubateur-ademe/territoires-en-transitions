export type WorkflowTransitionDef<
  TStatus extends string,
  TGuardId extends string = never
> = {
  from: readonly TStatus[];
  to: TStatus;
  /**
   * Conditions d'application de la transition (état métier, acteur, délais…),
   * évaluées par l'appelant — côté serveur pour faire autorité. L'ordre est
   * significatif : c'est celui dans lequel les refus sont rapportés, donc
   * l'ordre de priorité des messages affichés.
   */
  guards?: readonly TGuardId[];
};

export type WorkflowGuardResults<TGuardId extends string> = Partial<
  Record<TGuardId, boolean>
>;

export type WorkflowTransitionError =
  | 'TRANSITION_NOT_ALLOWED'
  | 'GUARD_NOT_SATISFIED';

/**
 * État d'une transition pour un statut et un utilisateur donnés. `reachable`
 * et `enabled` répondent à deux questions distinctes : la transition part-elle
 * du statut courant (sinon elle n'a pas à être affichée du tout), et est-elle
 * applicable ici et maintenant (sinon elle s'affiche désarmée, `blockedBy`
 * disant pourquoi).
 */
export type WorkflowTransitionEvaluation<TGuardId extends string> = {
  reachable: boolean;
  enabled: boolean;
  /** Guards non satisfaits, dans leur ordre de déclaration. */
  blockedBy: TGuardId[];
};

export type WorkflowEvaluation<
  TTransition extends string,
  TGuardId extends string
> = Record<TTransition, WorkflowTransitionEvaluation<TGuardId>>;

export type WorkflowApplyResult<
  TStatus extends string,
  TGuardId extends string = never
> =
  | { success: true; data: { toStatus: TStatus } }
  | {
      success: false;
      error: WorkflowTransitionError;
      /** Vide sur `TRANSITION_NOT_ALLOWED` : c'est le statut qui refuse. */
      blockedBy: TGuardId[];
    };

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

/**
 * Une machine à états, et rien de plus : des statuts, les transitions qui les
 * relient, et les conditions de ces transitions. Ce qu'un état autorise sans en
 * sortir (éditer, déposer) n'est pas de son ressort.
 */
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
  /** Transitions partant de ce statut, guards ignorés. */
  getReachableTransitions(status: TStatus): TTransition[];
  /** Guards dont dépend au moins une transition partant de ce statut. */
  getRequiredGuards(status: TStatus): TGuardId[];
  /** État de chaque transition pour ce statut et ces résultats de guards. */
  evaluate(
    status: TStatus,
    guardResults?: WorkflowGuardResults<TGuardId>
  ): WorkflowEvaluation<TTransition, TGuardId>;
  apply(
    status: TStatus,
    transition: TTransition,
    options?: WorkflowApplyOptions<TGuardId>
  ): WorkflowApplyResult<TStatus, TGuardId>;
}
