// résultat standardisé d'une méthode
export type Result<Data, ServiceError, Cause extends Error = Error> =
  | { success: true; data: Data }
  | { success: false; error: ServiceError; cause?: Cause };

export const success = <Data>(data: Data): Result<Data, never> => ({
  success: true,
  data,
});
export const failure = <ServiceError, Cause extends Error = Error>(
  error: ServiceError,
  cause?: Cause
): Result<never, ServiceError> => ({ success: false, error, cause });

export const combineResults = <Data, ServiceError>(
  results: Result<Data, ServiceError>[]
): Result<Data[], ServiceError> => {
  const successResults = results.filter((result) => result.success);
  const failureResults = results.filter((result) => !result.success);
  if (failureResults.length > 0) {
    return failure(failureResults[0].error);
  }
  return success(successResults.map((result) => result.data));
};
