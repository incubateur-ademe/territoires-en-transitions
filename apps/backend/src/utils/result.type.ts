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

export const isSuccess = <Data, ServiceError>(
  result: Result<Data, ServiceError>
): result is { success: true; data: Data } => result.success;

export const isFailure = <Data, ServiceError, Cause extends Error = Error>(
  result: Result<Data, ServiceError, Cause>
): result is { success: false; error: ServiceError; cause?: Cause } =>
  !result.success;

export const combineResults = <Data, ServiceError>(
  results: Result<Data, ServiceError>[]
): Result<Data[], ServiceError> => {
  const firstFailure = results.find(isFailure);
  if (firstFailure) {
    return failure(firstFailure.error);
  }
  return success(results.filter(isSuccess).map((result) => result.data));
};
