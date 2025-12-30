// résultat standardisé d'une méthode
export type MethodResult<Data, ServiceError, Cause extends Error = Error> =
  | { success: true; data: Data }
  | { success: false; error: ServiceError; cause?: Cause };
