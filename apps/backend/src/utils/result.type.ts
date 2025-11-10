// résultat standardisé d'une méthode
export type MethodResult<Data, Error> =
  | { success: true; data: Data }
  | { success: false; error: Error };
