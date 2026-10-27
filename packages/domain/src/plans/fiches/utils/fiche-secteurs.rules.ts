import { ReponseSecteursCommuns } from '../fiche-secteurs.schema';
import {
  SecteurReglementaire,
  secteurReglementaireEnumValues,
} from '../secteur-reglementaire.enum.schema';

/** Le secteur dont relève l'action (rattachement réglementaire), pas celui sur lequel elle agit */
export const SEMANTIQUE_SECTEURS = 'secteursDirect' satisfies keyof Pick<
  ReponseSecteursCommuns,
  'secteursDirect' | 'secteursContribution'
>;

export const SEUIL_PART_SECTEUR = 0.2;

/** Liste vide : fiche non attribuable. `null` : fiche pas encore classée */
export const getSecteursRetenus = (
  reponse: ReponseSecteursCommuns
): SecteurReglementaire[] | null => {
  const repartition = reponse[SEMANTIQUE_SECTEURS];
  if (!repartition) {
    return null;
  }
  return secteurReglementaireEnumValues.filter(
    (secteur) => (repartition.parts[secteur] ?? 0) >= SEUIL_PART_SECTEUR
  );
};

/**
 * Actions du plan dont les secteurs réglementaires restent à compléter par la
 * collectivité. Celles « en cours de calcul » n'en sont pas : elles attendent
 * Communs, pas la collectivité, et y restent tant que l'API n'est pas configurée.
 */
export const countPlanSecteursARenseigner = ({
  aRenseigner,
  nonAttribuables,
}: {
  aRenseigner: number;
  nonAttribuables: number;
}): number => aRenseigner + nonAttribuables;
