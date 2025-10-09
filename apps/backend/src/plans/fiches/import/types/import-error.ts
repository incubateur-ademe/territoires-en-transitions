/**
 * Import Error Codes
 *
 * Structured error codes for import operations, allowing consumers
 * to identify the type of error and handle it appropriately.
 */
export enum ImportErrorCode {
  // Parsing errors
  EXCEL_PARSING_FAILED = 'EXCEL_PARSING_FAILED',
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',

  // Transformation errors
  TRANSFORMATION_FAILED = 'TRANSFORMATION_FAILED',

  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',

  // Entity resolution errors
  ENTITY_RESOLUTION_FAILED = 'ENTITY_RESOLUTION_FAILED',
  TAG_CREATION_FAILED = 'TAG_CREATION_FAILED',

  // Adaptation errors
  ADAPTATION_FAILED = 'ADAPTATION_FAILED',
  MISSING_RESOLVED_ENTITIES = 'MISSING_RESOLVED_ENTITIES',

  // Plan creation errors
  PLAN_CREATION_FAILED = 'PLAN_CREATION_FAILED',
  INVALID_PLAN_STRUCTURE = 'INVALID_PLAN_STRUCTURE',

  // System errors
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Rich Import Error
 *
 * Separates user-facing messages from technical details:
 * - `code`: Identifies the error type for programmatic handling
 * - `userMessage`: High-level message for end users (French, user-friendly)
 * - `technicalDetails`: Low-level details for developers/logs (can be complex)
 * - `cause`: The original error object (for full stack trace, debugging)
 *
 * Example:
 * ```typescript
 * {
 *   code: 'VALIDATION_FAILED',
 *   userMessage: 'Le plan contient des erreurs de validation',
 *   technicalDetails: {
 *     field: 'titre',
 *     value: '',
 *     validationError: 'Le titre de la fiche est obligatoire'
 *   },
 *   cause: validationError
 * }
 * ```
 */
export interface ImportError {
  /** Error code for programmatic handling */
  code: ImportErrorCode;

  /** User-friendly message (French, high-level) */
  userMessage: string;

  /** Technical details for developers/logs */
  technicalDetails?: unknown;
}

/**
 * Factory functions to create ImportError instances
 */
export const ImportErrors = {
  excelParsing: (cause?: unknown): ImportError => ({
    code: ImportErrorCode.EXCEL_PARSING_FAILED,
    userMessage:
      'Erreur lors de la lecture du fichier Excel : ' +
      (cause instanceof Error ? cause.message : String(cause)),
    technicalDetails: {
      step: 'excel-parsing',
      message: cause instanceof Error ? cause.message : String(cause),
    },
  }),

  transformation: (cause?: unknown): ImportError => ({
    code: ImportErrorCode.TRANSFORMATION_FAILED,
    userMessage:
      'Erreur lors de la transformation des données : \n ' +
      (cause instanceof Error ? cause.message : String(cause)),
    technicalDetails: {
      step: 'transformation',
      message: cause instanceof Error ? cause.message : String(cause),
    },
  }),

  validation: (validationError: unknown): ImportError => ({
    code: ImportErrorCode.VALIDATION_FAILED,
    userMessage:
      'Le plan contient des erreurs de validation : \n ' +
      (validationError instanceof Error
        ? validationError.message
        : String(validationError)),
    technicalDetails: {
      step: 'validation',
      message:
        validationError instanceof Error
          ? validationError.message
          : String(validationError),
    },
  }),

  entityResolution: (details?: unknown): ImportError => ({
    code: ImportErrorCode.ENTITY_RESOLUTION_FAILED,
    userMessage:
      'Erreur lors de la résolution des entités (pilotes, structures, etc.) : \n ' +
      (details instanceof Error ? details.message : String(details)),
    technicalDetails: {
      step: 'entity-resolution',
      message: details instanceof Error ? details.message : String(details),
    },
  }),

  adaptation: (ficheTitle: string, axisPath: string[]): ImportError => ({
    code: ImportErrorCode.MISSING_RESOLVED_ENTITIES,
    userMessage:
      `Impossible de créer la fiche "${ficheTitle}" : \n ` +
      (axisPath.join(' > ') + 'Aucune entité résolue trouvée pour cette fiche'),
    technicalDetails: {
      ficheTitle,
      axisPath,
    },
  }),

  planCreation: (cause?: unknown): ImportError => ({
    code: ImportErrorCode.PLAN_CREATION_FAILED,
    userMessage:
      'Erreur lors de la création du plan : \n ' +
      (cause instanceof Error ? cause.message : String(cause)),
    technicalDetails: {
      step: 'plan-creation',
      error: cause instanceof Error ? cause.message : String(cause),
    },
  }),

  transaction: (cause?: unknown): ImportError => ({
    code: ImportErrorCode.TRANSACTION_FAILED,
    userMessage:
      "Erreur lors de l'enregistrement des données : \n " +
      (cause instanceof Error ? cause.message : String(cause)),
    technicalDetails: {
      step: 'transaction',
      message: cause instanceof Error ? cause.message : String(cause),
    },
  }),

  unknown: (cause?: unknown): ImportError => ({
    code: ImportErrorCode.UNKNOWN_ERROR,
    userMessage:
      "Une erreur inattendue s'est produite : \n " +
      (cause instanceof Error ? cause.message : String(cause)),
    technicalDetails: cause instanceof Error ? cause.message : String(cause),
  }),
};
