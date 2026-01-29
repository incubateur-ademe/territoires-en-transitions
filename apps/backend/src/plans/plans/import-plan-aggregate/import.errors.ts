/**
 * Import Errors - Simple and Practical
 *
 * All import errors in one place.
 * Classes extend Error for stack traces.
 * _tag for type discrimination.
 * Pattern Result to propagate errors up to the router.
 */

/**
 * Base class for all import errors
 */
export abstract class ImportError extends Error {
  abstract readonly _tag: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// ============================================================================
// PARSING & FORMAT ERRORS
// ============================================================================

export class ExcelParsingError extends ImportError {
  readonly _tag = 'ExcelParsingError' as const;
  constructor(public readonly cause?: unknown) {
    const msg = cause instanceof Error ? cause.message : String(cause);
    super(`Erreur lors de la lecture du fichier Excel : ${msg}`);
  }
}

export class InvalidExcelFormat extends ImportError {
  readonly _tag = 'InvalidExcelFormat' as const;
  constructor(public readonly reason: string) {
    super(`Format de fichier Excel invalide : ${reason}`);
  }
}

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

export class InvalidPlanType extends ImportError {
  readonly _tag = 'InvalidPlanType' as const;
  constructor(public readonly typeId: number) {
    super(`Type de plan invalide : ${typeId}`);
  }
}

export class InvalidFicheTitre extends ImportError {
  readonly _tag = 'InvalidFicheTitre' as const;
  constructor(public readonly titre: string, public readonly row?: number) {
    super(
      `Le titre de la fiche est invalide${
        row ? ` (ligne ${row})` : ''
      } : "${titre}"`
    );
  }
}

export class InvalidDateRange extends ImportError {
  readonly _tag = 'InvalidDateRange' as const;
  constructor(
    public readonly dateDebut: Date,
    public readonly dateFin: Date,
    public readonly row?: number
  ) {
    super(
      `La date de fin doit être après la date de début${
        row ? ` (ligne ${row})` : ''
      }`
    );
  }
}

export class InvalidBudget extends ImportError {
  readonly _tag = 'InvalidBudget' as const;
  constructor(
    public readonly value: unknown,
    public readonly reason: string,
    public readonly row?: number
  ) {
    super(`Budget invalide${row ? ` (ligne ${row})` : ''} : ${reason}`);
  }
}

// ============================================================================
// ENTITY RESOLUTION ERRORS
// ============================================================================

export class EntityResolutionError extends ImportError {
  readonly _tag = 'EntityResolutionError' as const;
  constructor(
    public readonly entityType: string,
    public readonly entityName: string,
    public readonly cause?: unknown
  ) {
    const msg = cause
      ? cause instanceof Error
        ? cause.message
        : String(cause)
      : '';
    super(
      `Impossible de résoudre ${entityType} "${entityName}"${
        msg ? ` : ${msg}` : ''
      }`
    );
  }
}

export class TagCreationError extends ImportError {
  readonly _tag = 'TagCreationError' as const;
  constructor(public readonly tagName: string, public readonly cause: unknown) {
    const msg = cause instanceof Error ? cause.message : String(cause);
    super(`Erreur lors de la création du tag "${tagName}" : ${msg}`);
  }
}

// ============================================================================
// PLAN CREATION ERRORS
// ============================================================================

export class PlanCreationError extends ImportError {
  readonly _tag = 'PlanCreationError' as const;
  constructor(public readonly cause: unknown) {
    const msg = cause instanceof Error ? cause.message : String(cause);
    super(`Erreur lors de la création du plan : ${msg}`);
  }
}

export class TransactionError extends ImportError {
  readonly _tag = 'TransactionError' as const;
  constructor(public readonly cause: unknown) {
    const msg = cause instanceof Error ? cause.message : String(cause);
    super(`Erreur lors de la transaction : ${msg}`);
  }
}

// ============================================================================
// TRANSFORMATION ERRORS
// ============================================================================

export class TransformationError extends ImportError {
  readonly _tag = 'TransformationError' as const;
  constructor(public readonly cause?: unknown) {
    const msg = cause instanceof Error ? cause.message : String(cause);
    super(`Erreur lors de la transformation des données :\n ${msg}`);
  }
}

// ============================================================================
// UNION TYPE
// ============================================================================

export type ImportErrors =
  | ExcelParsingError
  | InvalidExcelFormat
  | InvalidPlanType
  | InvalidFicheTitre
  | InvalidDateRange
  | InvalidBudget
  | EntityResolutionError
  | TagCreationError
  | PlanCreationError
  | TransactionError
  | TransformationError;

/**
 * Type guard
 */
export function isImportError(error: unknown): error is ImportErrors {
  return error instanceof ImportError;
}

/**
 * Is this error something the user can fix? (vs system error)
 */
export function isClientError(error: ImportErrors): boolean {
  switch (error._tag) {
    case 'ExcelParsingError':
    case 'InvalidExcelFormat':
    case 'InvalidPlanType':
    case 'InvalidFicheTitre':
    case 'InvalidDateRange':
    case 'InvalidBudget':
    case 'TransformationError':
      return true;

    case 'EntityResolutionError':
    case 'TagCreationError':
    case 'PlanCreationError':
    case 'TransactionError':
      return false;

    default: {
      /** With the following line if an Error is not handled
       *  TS will raise an error
       **/
      const _: never = error;
      return false;
    }
  }
}
