type SecteurLeviers = {
  nom: string;
  resultat2019: number | null;
  objectif2019: number | null;
  objectif2030: number | null;
};

/**
 * Secteurs que le mondrian écarte sans prévenir faute de données : même règle
 * que le package `mondrian-treemap`, qui ignore un secteur sans base
 * (`resultat2019 ?? objectif2019`) ou sans objectif 2030. On ne lit pas
 * `identifiantManquants`, qui liste aussi des sous-secteurs ou des postes
 * (`cae_1.csc`) dont l'absence n'écarte pas le secteur.
 */
export function getSecteursNonRepresentes(
  secteurs: SecteurLeviers[]
): string[] {
  return secteurs
    .filter(
      (secteur) =>
        !(secteur.resultat2019 ?? secteur.objectif2019) || !secteur.objectif2030
    )
    .map((secteur) => secteur.nom);
}
