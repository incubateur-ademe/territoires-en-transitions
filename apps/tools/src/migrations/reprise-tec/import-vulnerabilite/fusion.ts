/** La fusion : une ligne TeT par démarche et par thématique, où plusieurs libellés T&C peuvent tomber (Résidentiel et Tertiaire dans Bâtiments). */

import type { Ligne } from './lignes';
import { toTexte, type Niveau } from './niveau';
import type { Thematique } from './thematiques';

export type Valeur = {
  demarcheId: number;
  collectiviteId: number;
  thematique: Thematique;
  niveau: Niveau | null;
  objectifs: string | null;
  // la ligne s'écrit dans TeT : elle a un niveau ou un objectif ; pour une thématique de la collectivité, autre chose que « non concerné »
  aEcrire: boolean;
  // les lignes T&C réunies, chacune écrite si son niveau est celui retenu ou si son objectif est écrit
  lignes: { ligne: Ligne; ecrite: boolean }[];
};

// Le rang d'une ligne dans la fusion : le plus haut l'emporte. « Oui » sans niveau passe devant « non concerné ».
const RANGS: Record<Niveau | 'oui', number> = {
  fort: 5,
  moyen: 4,
  faible: 3,
  oui: 2,
  non_concerne: 1,
};

/** Réunit les lignes d'une démarche et d'une thématique ; niveau retenu : fort > moyen > faible > « Oui » sans niveau > non concerné > rien. */
export const mergeLignes = (lignes: readonly Ligne[]): Valeur[] => {
  const groupes = new Map<string, Ligne[]>();
  for (const ligne of lignes) {
    if (ligne.thematique === null) {
      continue;
    }
    const cle = `${ligne.demarcheId}|${JSON.stringify(ligne.thematique)}`;
    groupes.set(cle, [...(groupes.get(cle) ?? []), ligne]);
  }

  return [...groupes.values()].map((groupe) => {
    const [premiere] = groupe;
    const thematique = premiere.thematique as Thematique;
    const retenu = groupe
      .map(toRang)
      .reduce<Niveau | 'oui' | null>(
        (haut, rang) =>
          rang !== null && (haut === null || RANGS[rang] > RANGS[haut])
            ? rang
            : haut,
        null
      );
    const niveau = retenu === 'oui' ? null : retenu;
    const objectifs = joinObjectifs(groupe);
    const aEcrire =
      objectifs !== null ||
      (niveau !== null && ('code' in thematique || niveau !== 'non_concerne'));

    return {
      demarcheId: premiere.demarcheId,
      collectiviteId: premiere.collectiviteId,
      thematique,
      niveau,
      objectifs,
      aEcrire,
      lignes: groupe.map((ligne) => ({
        ligne,
        ecrite:
          aEcrire &&
          (ligne.objectif.objectif !== null ||
            (niveau !== null && ligne.vulnerable.niveau === niveau)),
      })),
    };
  });
};

/** Le rang d'une ligne : son niveau, « oui » pour un « Oui » sans niveau, `null` si elle ne dit rien. */
const toRang = ({ vulnerable }: Ligne) =>
  vulnerable.niveau ?? (vulnerable.oui ? 'oui' : null);

/** Colle les objectifs : un seul tel quel ; plusieurs, « libellé T&C : texte », séparés par « / » ; un texte identique une fois. */
const joinObjectifs = (groupe: readonly Ligne[]) => {
  const parTexte = new Map<string, string>();
  for (const { libelle, objectif } of groupe) {
    if (objectif.objectif !== null && !parTexte.has(objectif.objectif)) {
      parTexte.set(objectif.objectif, toTexte(libelle));
    }
  }
  const objectifs = [...parTexte];
  if (objectifs.length === 0) {
    return null;
  }
  if (objectifs.length === 1) {
    return objectifs[0][0];
  }
  return objectifs
    .map(([objectif, libelle]) => `${libelle} : ${objectif}`)
    .join(' / ');
};
