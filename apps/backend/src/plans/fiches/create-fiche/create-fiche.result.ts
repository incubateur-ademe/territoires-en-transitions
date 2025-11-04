export type CreateFicheError = string;

export type Result<T, E = CreateFicheError> =
  | { success: true; data: T }
  | { success: false; error: E };

