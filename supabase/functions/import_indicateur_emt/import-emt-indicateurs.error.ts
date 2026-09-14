/** A malformed or incompatible EMT import supplied by the caller. */
export class InvalidEmtImportError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = InvalidEmtImportError.name;
  }
}

export const asInvalidEmtImportError = (
  error: unknown,
  fallbackMessage: string
): InvalidEmtImportError =>
  error instanceof InvalidEmtImportError
    ? error
    : new InvalidEmtImportError(fallbackMessage, { cause: error });
