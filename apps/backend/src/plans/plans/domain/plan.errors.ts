/**
 * Plan Domain Errors
 *
 * Erreurs métier typées pour le domaine Plan.
 * Ces erreurs représentent des violations de règles métier,
 * pas des erreurs techniques ou d'infrastructure.
 */

export class PlanDomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'PlanDomainError';
  }
}

/**
 * L'agrégat du plan (axes-fiches) est incohérent
 */
export class IncoherentPlanAggregate extends PlanDomainError {
  constructor(
    public readonly reason: string,
    public readonly ficheCount?: number
  ) {
    super(
      'INCOHERENT_PLAN_AGGREGATE',
      `Agrégat de plan incohérent : ${reason}`,
      { cause: { reason, ficheCount } }
    );
    this.name = 'IncoherentPlanAggregate';
  }
}

/**
 * Des fiches référencent des axes qui n'existent pas
 */
export class OrphanedFiches extends PlanDomainError {
  constructor(
    public readonly orphanCount: number,
    public readonly axePaths: string[]
  ) {
    super(
      'ORPHANED_FICHES',
      `${orphanCount} fiche(s) référencent des axes inexistants`,
      { cause: { orphanCount, axePaths } }
    );
    this.name = 'OrphanedFiches';
  }
}

/**
 * La hiérarchie des axes est invalide (parent manquant)
 */
export class InvalidAxeHierarchy extends PlanDomainError {
  constructor(
    public readonly axePath: string[],
    public readonly missingParent: string[]
  ) {
    super(
      'INVALID_AXE_HIERARCHY',
      `Hiérarchie d'axes invalide : parent manquant pour ${axePath.join(
        ' > '
      )}`,
      { cause: { axePath, missingParent } }
    );
    this.name = 'InvalidAxeHierarchy';
  }
}

/**
 * Validation des données d'entrée échouée
 */
export class InvalidPlanData extends PlanDomainError {
  constructor(public readonly reason: string, public readonly field?: string) {
    super('INVALID_PLAN_DATA', `Données de plan invalides : ${reason}`, {
      cause: { field, reason },
    });
    this.name = 'InvalidPlanData';
  }
}

/**
 * Le nom du plan est invalide
 */
export class InvalidPlanName extends PlanDomainError {
  constructor(public readonly name: string, public readonly reason?: string) {
    super(
      'INVALID_PLAN_NAME',
      `Nom de plan invalide : "${name}" ${reason || ''}`,
      { cause: { name, reason } }
    );
    this.name = 'InvalidPlanName';
  }
}

/**
 * Union type de toutes les erreurs de domaine Plan
 */
export type PlanCreationError =
  | IncoherentPlanAggregate
  | OrphanedFiches
  | InvalidAxeHierarchy
  | InvalidPlanData
  | InvalidPlanName;
