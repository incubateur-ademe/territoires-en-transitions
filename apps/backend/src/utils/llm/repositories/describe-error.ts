/** Message d'erreur d'appel LLM, avec sa cause réseau quand il y en a une. */
export const describeError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return String(error);
  }
  const { cause } = error;
  if (cause instanceof Error) {
    const code = errorCode(cause);
    const prefix = code === null ? '' : `${code} `;
    return `${error.message} — cause: ${prefix}${cause.message}`;
  }
  return error.message;
};

const errorCode = (error: Error): string | null =>
  'code' in error && typeof error.code === 'string' ? error.code : null;
