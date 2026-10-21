/**
 * Ce qu'une colonne contient : déduit de ses valeurs par `inferSheetLayout`,
 * son libellé ne fait que départager.
 */
export type ColumnRole =
  | 'hierarchie'
  | 'numero'
  | 'titre'
  | 'sousAction'
  | 'structurePilote'
  | 'servicePilote'
  | 'personnePilote'
  | 'partenaires'
  | 'statut'
  | 'priorite'
  | 'calendrier'
  | 'dateDebut'
  | 'dateFin'
  | 'budget'
  | 'budgetConsomme'
  | 'financements'
  | 'moyensHumains'
  | 'description'
  | 'commentaire'
  | 'objectifs'
  | 'indicateur'
  | 'cible'
  | 'autre'
  | 'vide';

export type LabelRole = Exclude<ColumnRole, 'autre' | 'vide'>;

// Du plus précis au plus général : « Titre de la sous-action » est une
// sous-action avant d'être un titre, « Budget consommé » un budget consommé
// avant d'être un budget, « Objectifs stratégiques » un niveau d'axe avant
// d'être des objectifs.
const SYNONYMS: ReadonlyArray<readonly [LabelRole, RegExp]> = [
  [
    'sousAction',
    /sous[- ]?actions?|\betapes?\b|\btaches?\b|actions? operationnelles?|declinaisons?|actions? detaillees?/,
  ],
  [
    'budgetConsomme',
    /(budget|montant|cout|credits?)\b.*\b(consomm|realise|depense|engage|mandate|paye)|\bconsommee?s?\b|depenses? realisees?/,
  ],
  ['financements', /financ|subvention|\baides?\b|dotation/],
  [
    'budget',
    /budget|\bcouts?\b|montant|€|\beuros?\b|enveloppe|investissement|previsionnel|chiffrage/,
  ],
  ['cible', /\bcibles?\b|valeurs? a atteindre|objectifs? chiffres?/],
  ['indicateur', /indicateur/],
  ['numero', /^(n ?[°º]|no\b|num(ero)?\b|code\b|ref(erence)?\b|id\b|#)/],
  ['dateDebut', /debut|demarrage|lancement|commencement/],
  ['dateFin', /\bfin\b|echeance|\bterme\b|achevement|livraison|cloture/],
  [
    'statut',
    /statut|\betat\b|avancement|(niveau|taux) de realisation|situation/,
  ],
  [
    'calendrier',
    /calendrier|planning|echeancier|chronogramme|\bannees?\b|periode|horizon|(^|\D)(19|20)\d{2}(\D|$)|\bt[1-4]\b|trimestre|semestre/,
  ],
  [
    'commentaire',
    /commentaire|remarque|observation|\bnotes?\b|precision|suivi qualitatif/,
  ],
  ['description', /descri|contenu|detail|contexte|presentation|modalites?/],
  ['priorite', /priorit/],
  ['moyensHumains', /moyens|\betp\b|ressources humaines/],
  [
    'partenaires',
    /partenaire|acteurs? (associes|mobilises|concernes)|parties prenantes/,
  ],
  // « Service référent » nomme un service : le service avant la personne.
  ['servicePilote', /direction|service/],
  [
    'personnePilote',
    /personne|referent|\belu(e|s)?\b|chef de projet|charge(e)? de mission|interlocuteur|contact/,
  ],
  [
    'structurePilote',
    /pilot|porteur|porte par|responsable|maitr(e|ise) d.ouvrage|structure|\bqui\b|operateur/,
  ],
  [
    'hierarchie',
    /\baxes?\b|orientation|objectifs? (strategiques?|operationnels?|generaux?|specifiques?)|enjeux?\b|\bthemes?\b|thematiques?|domaines?|volets?|ambitions?|leviers?|piliers?|defis?|programmes?|chapitres?|categories?|strategie/,
  ],
  ['objectifs', /objectif|resultats? attendus?|finalite/],
  [
    'titre',
    /fiche|\bactions?\b|intitule|titre|propositions?|mesures?|projets?|libelle|\bnom\b|designation/,
  ],
];

const normalizeLabel = (label: string): string =>
  label
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const matchOne = (label: string): LabelRole | null => {
  const normalized = normalizeLabel(label);
  if (normalized === '') {
    return null;
  }
  return SYNONYMS.find(([, pattern]) => pattern.test(normalized))?.[0] ?? null;
};

/**
 * Le rôle que le libellé d'une colonne annonce. Un libellé composé sur deux
 * rangées (« SUIVI BUDGETAIRE · Budget consommé ») se lit par son détail.
 */
export const matchColumnLabel = (label: string): LabelRole | null => {
  const detail = label.split(' · ').at(-1) ?? '';
  return matchOne(detail) ?? matchOne(label);
};

/** Le libellé d'une ligne de fiche-formulaire, sans ses deux-points. */
export const matchFieldLabel = (label: string): LabelRole | null =>
  matchColumnLabel(label.replace(/\s*[:：]\s*$/, ''));

const PILOTE_ROLES: ReadonlySet<ColumnRole> = new Set([
  'structurePilote',
  'servicePilote',
  'personnePilote',
  'partenaires',
]);

/** Deux rôles qui ne se contredisent pas : un pilote reste un pilote. */
export const areCompatibleRoles = (a: ColumnRole, b: ColumnRole): boolean =>
  a === b ||
  (PILOTE_ROLES.has(a) && PILOTE_ROLES.has(b)) ||
  (a === 'commentaire' && b === 'description') ||
  (a === 'description' && b === 'commentaire') ||
  (a === 'budget' && b === 'financements') ||
  (a === 'indicateur' && b === 'objectifs') ||
  (a === 'objectifs' && b === 'indicateur');

export const describeColumnRole = (role: ColumnRole): string =>
  ROLE_DESCRIPTIONS[role];

const ROLE_DESCRIPTIONS: Record<ColumnRole, string> = {
  hierarchie: "niveau d'axe",
  numero: 'n° de fiche',
  titre: 'titre de fiche',
  sousAction: 'sous-actions',
  structurePilote: 'structure pilote',
  servicePilote: 'direction ou service pilote',
  personnePilote: 'personne pilote',
  partenaires: 'partenaires',
  statut: 'statut',
  priorite: 'priorité',
  calendrier: 'calendrier',
  dateDebut: 'date de début',
  dateFin: 'date de fin',
  budget: 'budget',
  budgetConsomme: 'budget consommé',
  financements: 'financements',
  moyensHumains: 'moyens humains',
  description: 'description',
  commentaire: 'commentaires',
  objectifs: 'objectifs',
  indicateur: 'indicateurs',
  cible: 'valeurs cibles',
  autre: 'non reconnue',
  vide: 'vide',
};
