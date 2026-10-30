export type Niveau = 'non_concerne' | 'faible' | 'moyen' | 'fort';

export type Vulnerable = {
  niveau: Niveau | null;
  oui: boolean;
  texte: string | null;
};

export type Objectif = {
  objectif: string | null;
  motif: 'objectif_oui_non' | 'valeur_vide' | null;
};

// Les formes longues d'abord : « très forte » ne doit pas être lu « très ».
const MOTS_DE_NIVEAU: readonly (readonly [string, Niveau | 'oui' | null])[] = [
  ['moyenne à forte', null],
  ['très forte', 'fort'],
  ['très élevée', 'fort'],
  ['très faible', 'faible'],
  ['fortes', 'fort'],
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

const OUI_NON = ['oui', 'non'];
const MARQUES_DE_VIDE = ['', '-', '/', '0', 'ras', 'néant'];

export const toTexte = (cellule: string | null) =>
  (cellule ?? '').replace(/\s+/g, ' ').trim();

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
