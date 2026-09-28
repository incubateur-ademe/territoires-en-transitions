export type HeadingKind =
  | 'axe'
  | 'orientation'
  | 'fiche'
  | 'numero'
  | 'section'
  | 'majuscules'
  | 'markdown';

export type HeadingMatch = {
  kind: HeadingKind;
  /** 0 = partie du document, 1 = axe, 2 = orientation ou sous-axe, 3 et plus = fiche. */
  level: number;
  number: string | null;
  title: string;
  /** Entre 0 et 1 ; en dessous de `HEADING_CONFIDENCE_THRESHOLD`, la ligne n'est pas un titre. */
  confidence: number;
};

export const HEADING_CONFIDENCE_THRESHOLD = 0.6;
export const SECTION_LEVEL = 0;
export const FICHE_LEVEL = 3;

const MAX_TITLE_LENGTH = 120;
const SENTENCE_MIN_WORDS = 12;

const SEPARATOR = String.raw`\s*[:.\-–—)]?\s*`;
const NUMBER = String.raw`(?:n[°º]\s*|#\s*)?`;

// Les motifs suivent la façon dont les plans français nomment leurs niveaux.
const AXE = new RegExp(
  String.raw`^axe\s*${NUMBER}(\d{1,2}|[IVX]{1,4})${SEPARATOR}(.*)$`,
  'iu'
);
const ORIENTATION = new RegExp(
  String.raw`^(?:orientation|objectif(?:\s+strat[ée]gique|\s+op[ée]rationnel)?|enjeu|d[ée]fi|priorit[ée]|th[ée]matique|volet|ambition|levier|chantier|pilier|sous[- ]axe)\s*${NUMBER}(\d+(?:\.\d+)*|[IVX]{1,4}|[A-Z])${SEPARATOR}(.*)$`,
  'iu'
);
const FICHE = new RegExp(
  String.raw`^(?:fiche(?:[\s-]*actions?)?|action|mesure|op[ée]ration|projet)\s*${NUMBER}([A-Z]{0,3}[\s-]?\d+(?:[.\-]\d+){0,3}[a-z]?)${SEPARATOR}(.*)$`,
  'iu'
);
// « 1.2.4 Titre » : le titre commence par une majuscule, sinon c'est « 1.5 tonnes ».
const NUMEROTATION =
  /^(\d{1,2}(?:\.\d{1,2}){1,3})\s*[.)\-–—:]?\s+(\p{Lu}.{2,119})$/u;
const MARKDOWN = /^(#{1,4})\s+(.+)$/u;
// « Plan d'actions à 2030 », « Programme d'actions 2024-2030 » : l'horizon suit parfois le nom.
const SECTION = new RegExp(
  String.raw`^(?:\d{1,2}[.)]?\s+)?(sommaire|table des mati[èe]res|diagnostic(?: territorial)?|[ée]tat des lieux|strat[ée]gie(?: territoriale)?|programme d['’]actions?|plan d['’]actions?|fiches?[\s-]actions?|catalogue des actions|plan op[ée]rationnel|engagements? des partenaires|suivi et [ée]valuation|gouvernance|annexes?|glossaire)(?:\s+(?:[àa]\s+|horizon\s+)?\d{4}(?:\s*[-–]\s*\d{4})?)?\s*$`,
  'iu'
);
// « I. TOUS HÉROS ORDINAIRES » : un axe numéroté en chiffres romains.
const ROMAIN = /^([IVX]{1,4})(?:\s*[.)]|\s+[-–—])\s+(.{3,})$/u;
// « 1 DANS L'ÉCO-RESPONSABILITÉ » : un numéro seul devant un titre en grande
// police, souvent la fin d'un titre commencé à la ligne du dessus.
const NUMERO_SEUL = /^(\d{1,2})\s*[.)\-–—:]?\s+(.{3,})$/u;
// Le contenu d'une fiche : un libellé de champ, pas un titre.
const FICHE_LABEL =
  /^(description|contexte|objectifs?|pilote|porteur|ma[iî]tr(?:e|ise) d['’]ouvrage|partenaires?|calendrier|[ée]ch[ée]ance|planning|budget|co[uû]t(?: estim[ée])?|financements?|indicateurs?(?: de suivi)?|cibles?|publics? vis[ée]s?|moyens|r[ée]sultats attendus|priorit[ée]|statut|[ée]tat d['’]avancement|gains? (?:ges|[ée]nerg[ée]tiques?))\s*[:：]?\s*$/iu;
// « Axe : » ou « Axe : 2 » : la valeur d'un champ de fiche, pas une frontière.
const FIELD_VALUE = /^(?:axe|orientation|objectif)\s*[:：]/iu;

export type HeadingContext = {
  /** Police nettement plus grande que le corps du texte. */
  isLarge?: boolean;
};

export const isFicheLabel = (text: string): boolean =>
  FICHE_LABEL.test(text.trim());

export const matchHeading = (
  text: string,
  { isLarge = false }: HeadingContext = {}
): HeadingMatch | null => {
  const line = text.trim();
  if (
    line.length === 0 ||
    line.length > MAX_TITLE_LENGTH ||
    isSentence(line) ||
    FIELD_VALUE.test(line) ||
    isFicheLabel(line)
  ) {
    return null;
  }

  const markdown = line.match(MARKDOWN);
  if (markdown) {
    const level = markdown[1].length;
    return {
      kind: 'markdown',
      level,
      ...splitNumber(markdown[2]),
      confidence: 1,
    };
  }
  const axe = line.match(AXE);
  if (axe) {
    return {
      kind: 'axe',
      level: 1,
      number: axe[1],
      title: axe[2].trim(),
      confidence: 1,
    };
  }
  const orientation = line.match(ORIENTATION);
  if (orientation) {
    // « Orientation 2.3 » est un sous-axe ; « Objectif 2.3.1 », une action.
    const depth = orientation[1].split('.').length;
    return {
      kind: 'orientation',
      level: Math.max(2, depth),
      number: orientation[1],
      title: orientation[2].trim(),
      confidence: 1,
    };
  }
  const fiche = line.match(FICHE);
  if (fiche) {
    return {
      kind: 'fiche',
      level: FICHE_LEVEL,
      number: fiche[1].trim(),
      title: fiche[2].trim(),
      confidence: 1,
    };
  }
  const section = line.match(SECTION);
  if (section) {
    return {
      kind: 'section',
      level: SECTION_LEVEL,
      number: null,
      title: line,
      confidence: 1,
    };
  }
  const romain = line.match(ROMAIN);
  if (romain && (isLarge || isUppercaseTitle(romain[2]))) {
    return {
      kind: 'axe',
      level: 1,
      number: romain[1],
      title: romain[2].trim(),
      confidence: 0.8,
    };
  }
  const numbered = line.match(NUMEROTATION);
  if (numbered) {
    const depth = numbered[1].split('.').length;
    return {
      kind: depth >= 3 ? 'fiche' : depth === 2 ? 'orientation' : 'axe',
      level: depth,
      number: numbered[1],
      title: numbered[2].trim(),
      confidence: 0.8,
    };
  }
  const numero = line.match(NUMERO_SEUL);
  if (numero && isLarge && isUppercaseTitle(numero[2])) {
    return {
      kind: 'numero',
      level: FICHE_LEVEL,
      number: numero[1],
      title: numero[2].trim(),
      confidence: 0.8,
    };
  }
  if (isUppercaseTitle(line)) {
    return {
      kind: 'majuscules',
      level: isLarge ? 1 : 2,
      number: null,
      title: line,
      confidence: isLarge ? 0.8 : 0.6,
    };
  }
  return null;
};

const isSentence = (line: string): boolean =>
  line.endsWith('.') && line.split(/\s+/).length >= SENTENCE_MIN_WORDS;

export const isUppercaseTitle = (line: string): boolean => {
  const letters = line.replace(/[^\p{L}]/gu, '');
  // « 400 000 € SYTRAL » : un chiffre clé mis en avant, pas un titre.
  if (letters.length < 6 || line.split(/\s+/).length < 2 || /^\d/.test(line)) {
    return false;
  }
  const upper = letters.replace(/[^\p{Lu}]/gu, '').length;
  return upper / letters.length >= 0.8 && !line.endsWith('.');
};

// « ## 2.3 Rénover » : le numéro reste exploitable derrière le dièse.
const splitNumber = (
  text: string
): { number: string | null; title: string } => {
  const match = text
    .trim()
    .match(/^(\d{1,2}(?:\.\d{1,2}){0,3})\s*[.)\-–—:]?\s+(.+)$/u);
  return match
    ? { number: match[1], title: match[2].trim() }
    : { number: null, title: text.trim() };
};
