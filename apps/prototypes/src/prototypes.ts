/** Un prototype publié : une route de `app/`, listée sur la page d'accueil. */
export type Prototype = Readonly<{
  slug: string;
  titre: string;
  description: string;
}>;

export const prototypes: ReadonlyArray<Prototype> = [];
