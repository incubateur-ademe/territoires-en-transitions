import { IndicateurSourceEnum } from './indicateur-source.enum';

export type TrajectoirePropertiesType<T extends string = string> = {
  identifiant: string;
  unite: string;
  sources: IndicateurSourceEnum[];
  secteurs: {
    nom: T;
    identifiant: string;
    sousSecteurs?: {
      nom: string;
      identifiant: string;
    }[];
  }[];
};

type Secteurs<T extends string> = TrajectoirePropertiesType<T>['secteurs'];

/** Copie de `secteurs` où `sousSecteur` est ajouté en fin du secteur `secteurNom`. */
export function addSousSecteur<T extends string>(
  secteurs: Secteurs<T>,
  secteurNom: T,
  sousSecteur: NonNullable<Secteurs<T>[number]['sousSecteurs']>[number]
): Secteurs<T> {
  return secteurs.map((secteur) =>
    secteur.nom === secteurNom
      ? {
          ...secteur,
          sousSecteurs: [...(secteur.sousSecteurs ?? []), sousSecteur],
        }
      : secteur
  );
}
