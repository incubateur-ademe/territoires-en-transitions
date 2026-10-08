import { partition } from 'es-toolkit';

export type LigneValeur = {
  id: number;
  annee: number;
  valeur: number;
  source: string;
};

export type GroupeAnnee = { annee: number; lignes: LigneValeur[] };

/**
 * Regroupe les lignes consécutives d'une même année, en conservant l'ordre
 * reçu : les lignes doivent donc être déjà triées par année.
 */
export const groupLignesByAnnee = (lignes: LigneValeur[]): GroupeAnnee[] =>
  lignes.reduce<GroupeAnnee[]>((groupes, ligne) => {
    const dernierGroupe = groupes[groupes.length - 1];
    if (dernierGroupe && dernierGroupe.annee === ligne.annee) {
      dernierGroupe.lignes.push(ligne);
    } else {
      groupes.push({ annee: ligne.annee, lignes: [ligne] });
    }
    return groupes;
  }, []);

/**
 * Sépare les groupes à partir de l'année de référence de ceux qui lui sont
 * antérieurs. Sans année de référence, tous les groupes sont affichables.
 */
export const partitionGroupesByAnneeReference = (
  groupes: GroupeAnnee[],
  anneeReference: number | null
): [affichables: GroupeAnnee[], anterieurs: GroupeAnnee[]] =>
  partition(
    groupes,
    (groupe) => anneeReference === null || groupe.annee >= anneeReference
  );

/**
 * Année du groupe à déplier par défaut : celui qui contient la valeur
 * sélectionnée, s'il regroupe plusieurs sources.
 */
export const getAnneeOuverteInitiale = (
  groupes: GroupeAnnee[],
  selectionneeId: number | null
): number | null => {
  const groupeSelectionne = groupes.find((groupe) =>
    groupe.lignes.some((ligne) => ligne.id === selectionneeId)
  );
  return groupeSelectionne && groupeSelectionne.lignes.length > 1
    ? groupeSelectionne.annee
    : null;
};
