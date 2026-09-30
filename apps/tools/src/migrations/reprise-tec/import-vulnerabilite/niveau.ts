/** Le niveau et l'objectif d'une ligne T&C, lus dans ses deux cellules de texte libre (« Oui », « Forte », une phrase…). */

export type Niveau = 'non_concerne' | 'faible' | 'moyen' | 'fort';

export type Vulnerable = {
  niveau: Niveau | null;
  // la cellule commence par « Oui » : la collectivité se dit vulnérable sans dire à quel point
  oui: boolean;
  // ce que la cellule dit en plus du niveau, ou toute la cellule quand aucun niveau n'y est lu
  texte: string | null;
};

export type Objectif = {
  // le texte écrit dans « Objectifs 2050 »
  objectif: string | null;
  // pourquoi la cellule n'est pas écrite
  motif: 'objectif_oui_non' | 'valeur_vide' | null;
};

// Le mot en tête de la cellule et ce qu'il devient ; les formes longues d'abord, pour que « très forte » ne soit pas lu « très ».
const MOTS_DE_NIVEAU: readonly (readonly [string, Niveau | 'oui' | null])[] = [
  ['moyenne à forte', null],
  ['très forte', 'fort'],
  ['très élevée', 'fort'],
  ['très faible', 'faible'],
  ['forte', 'fort'],
  ['fort', 'fort'],
  ['élevée', 'fort'],
  ['elevée', 'fort'],
  ['moyenne', 'moyen'],
  ['moyen', 'moyen'],
  ['modérée', 'moyen'],
  ['faible', 'faible'],
  ['nulle', 'non_concerne'],
  ['non', 'non_concerne'],
  ['oui', 'oui'],
];

// Ce qui, dans « objectif fixé », ne dit aucun objectif.
const OUI_NON = ['oui', 'non'];
const MARQUES_DE_VIDE = ['', '-', '/', '0', 'ras', 'néant'];

/** Réduit les espaces d'une cellule T&C ; vide si elle n'a rien. */
export const toTexte = (cellule: string | null) =>
  (cellule ?? '').replace(/\s+/g, ' ').trim();

/** Lit le niveau dans le mot en tête de « vulnérable », casse ignorée ; « Oui » n'en donne pas ; le texte qui suit est rendu à part. */
export const readVulnerable = (cellule: string | null): Vulnerable => {
  const texte = toTexte(cellule);
  const minuscules = texte.toLowerCase();
  const trouve = MOTS_DE_NIVEAU.find(
    ([mot]) =>
      minuscules.startsWith(mot) &&
      !/\p{L}/u.test(minuscules.charAt(mot.length))
  );
  if (trouve === undefined || trouve[1] === null) {
    return { niveau: null, oui: false, texte: texte || null };
  }
  const [mot, lu] = trouve;
  const suite = texte.slice(mot.length).replace(/^[\s:,;.\-–]+/, '');
  return {
    niveau: lu === 'oui' ? null : lu,
    oui: lu === 'oui',
    texte: suite || null,
  };
};

/** Lit l'objectif, écrit tel que saisi, sauf « Oui », « Non » et les marques de vide. */
export const readObjectif = (cellule: string | null): Objectif => {
  const texte = toTexte(cellule);
  const minuscules = texte.toLowerCase();
  if (OUI_NON.includes(minuscules)) {
    return { objectif: null, motif: 'objectif_oui_non' };
  }
  if (MARQUES_DE_VIDE.includes(minuscules)) {
    return { objectif: null, motif: 'valeur_vide' };
  }
  return { objectif: (cellule ?? '').trim(), motif: null };
};
