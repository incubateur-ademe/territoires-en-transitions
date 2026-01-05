// résultat standardisé d'une méthode
export type Result<Data, Error> =
  | { success: true; data: Data }
  | { success: false; error: Error };
