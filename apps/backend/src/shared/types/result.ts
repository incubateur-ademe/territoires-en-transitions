export type Result<T, E = string> = Success<T> | Failure<E>;

export interface Success<T> {
  success: true;
  data: T;
}

export interface Failure<E> {
  success: false;
  error: E;
}

export const success = <T>(data: T): Success<T> => ({
  success: true,
  data,
});

export const failure = <E>(error: E): Failure<E> => ({
  success: false,
  error,
});

// Helper to combine multiple results
export const combineResults = <T, E = string>(
  results: Result<T, E>[]
): Result<T[], E> => {
  const failures = results.filter((r): r is Failure<E> => !r.success);
  if (failures.length > 0) {
    return failure(failures[0].error);
  }
  return success(
    results.filter((r): r is Success<T> => r.success).map((r) => r.data)
  );
};
