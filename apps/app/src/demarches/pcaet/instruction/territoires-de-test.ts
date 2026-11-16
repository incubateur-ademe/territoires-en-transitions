/** Le code que portent la région et le département des collectivités de test. */
const CODE_TERRITOIRE_DE_TEST = '-1';

/** Retire le territoire de test d'une liste, sauf pour un super admin. */
export const filterTerritoiresDeTest = <T extends { code: string }>(
  territoires: T[],
  isSuperAdmin: boolean
): T[] =>
  isSuperAdmin
    ? territoires
    : territoires.filter(({ code }) => code !== CODE_TERRITOIRE_DE_TEST);
