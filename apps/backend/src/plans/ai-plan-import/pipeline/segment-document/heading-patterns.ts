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
  String.raw`^axe(?:\s+strat[ée]gique)?\s*${NUMBER}(\d{1,2}|[IVX]{1,4})(?!\p{L})${SEPARATOR}(.*)$`,
  'iu'
);
// « Axe 2 territoire (basée hors de la ville)- » : l'étiquette d'une colonne
// collée au texte de sa voisine, en minuscule et coupé au bord de la colonne
// (mot coupé, parenthèse restée ouverte). La minuscule seule ne suffit pas :
// « Axe 2 développer les mobilités douces » est un axe.
const AXE_GLUED_TO_TEXT = new RegExp(
  String.raw`^axe(?:\s+strat[ée]gique)?\s*${NUMBER}(?:\d{1,2}|[IVX]{1,4})\s+(.*)$`,
  'iu'
);
// « Orientation B – … », jamais « Orientation d'aménagement » : la lettre
// d'ordre n'est pas suivie d'une apostrophe.
const ORIENTATION = new RegExp(
  String.raw`^(?:orientation(?:\s+strat[ée]gique)?|objectif(?:\s+strat[ée]gique|\s+op[ée]rationnel)?|enjeu|d[ée]fi|priorit[ée]|th[ée]matique|volet|ambition|levier|chantier|pilier|sous[- ]axe)(?!\p{L})\s*${NUMBER}(\d+(?:\.\d+)*|[IVX]{1,4}|[A-Z])(?![\p{L}'’])${SEPARATOR}(.*)$`,
  'iu'
);
const FICHE = new RegExp(
  String.raw`^(?:fiche(?:[\s-]*(?:actions?|projets?|op[ée]rations?|mesures?))?|action|mesure|op[ée]ration|projet)\s*${NUMBER}([A-Z]{0,3}[\s-]?\d+(?:[.\-]\d+){0,3}[a-z]?)${SEPARATOR}(.*)$`,
  'iu'
);
// « Titre de l'action | 1.1 Anticiper… » : le cartouche d'une fiche, lu ligne
// par ligne, colle le libellé du champ à sa valeur. Le champ nomme la fiche.
const FICHE_TITLE_FIELD =
  /^(?:titre|intitul[ée]|nom)\s+(?:de\s+l['’]action|de\s+la\s+fiche(?:[\s-]actions?)?|de\s+la\s+mesure|du\s+projet)\s*[:：]?\s+(\S.*)$/iu;
// « Axe stratégique AXE 1 : … » : le même cartouche, pour l'axe de la fiche.
const AXE_FIELD = /^axe\s+strat[ée]gique\s+(?=axe\b)/iu;
// « 1.2.4 Titre » : le titre commence par une majuscule, sinon c'est « 1.5 tonnes ».
const NUMEROTATION =
  /^(\d{1,2}(?:\.\d{1,2}){1,3})\s*[.)\-–—:]?\s+(\p{Lu}.{2,119})$/u;
const MARKDOWN = /^(#{1,4})\s+(.+)$/u;
// « Plan d'actions à 2030 », « Programme d'actions 2024-2030 » : l'horizon suit parfois le nom.
const SECTION = new RegExp(
  String.raw`^(?:\d{1,2}[.)]?\s+)?(?:l['’]|les?\s+|la\s+)?(sommaire|table des mati[èe]res|diagnostic(?: territorial| climat[\s-]air[\s-][ée]nergie)?|[ée]tat des lieux|strat[ée]gie(?: territoriale)?|programme d['’]actions?|plan d['’]actions?|fiches?[\s-](?:actions?|projets?)|catalogue des actions|(?:plan|programme) op[ée]rationnel|feuille de route|vue d['’]ensemble du programme d['’]actions?|synth[èe]se du programme d['’]actions?|engagements? des partenaires|suivi et [ée]valuation|indicateurs et modalit[ée]s de suivi|gouvernance|m[ée]thodologie|[ée]valuation environnementale(?: strat[ée]gique)?|r[ée]sum[ée] non technique|[ée]tat initial de l['’]environnement|(?:analyse|[ée]valuation) des incidences(?:\s.+)?|incidences du (?:pcaet|plan|projet|programme|sch[ée]ma)|mesures d['’][ée]vitement, de r[ée]duction et de compensation|justification des choix|articulation avec les autres plans(?:\s.+)?|annexes?(?:\s+\d+\s*[:\-–—].+)?|glossaire)(?:\s+(?:[àa]\s+|horizon\s+)?\d{4}(?:\s*[-–]\s*\d{4})?)?\s*$`,
  'iu'
);
// « I. TOUS HÉROS ORDINAIRES » : un axe numéroté en chiffres romains.
const ROMAIN = /^([IVX]{1,4})(?:\s*[.)]|\s+[-–—])\s+(.{3,})$/u;
// « 1 DANS L'ÉCO-RESPONSABILITÉ » : un numéro seul devant un titre en grande
// police, souvent la fin d'un titre commencé à la ligne du dessus.
const NUMERO_SEUL = /^(\d{1,2})(?:\s*[.)\-–—:]\s*|\s+)(.{3,})$/u;
// « Actions 1-2-3 x x x » : la ligne d'un calendrier, cochée année par année.
const CHECK_MARKS = /^(?:\(.*\)\s*)?(?:[x✓✔☑]\s*)+$/iu;
const GLUED_NEXT_COLUMN =
  /(?<=\p{Ll})(?=(?:Action|Fiche|Mesure|Objectif)\s*(?:n[°º]\s*)?\d)|\s+(?=(?:Action|Fiche|Mesure)\s*(?:n[°º]\s*)?\d{1,2}\.\d)/u;
// Le contenu d'une fiche : un libellé de champ, pas un titre.
const FICHE_LABEL =
  /^(description|descriptif(?: de l['’]action)?|contexte|objectifs?|pilote|pilotes? et partenaires|flux vis[ée]s?|moyens n[ée]cessaires|calendrier pr[ée]visionnel|porteur|structure porteuse|porteurs? de l['’]action|ma[iî]tr(?:e|ise) d['’]ouvrage|partenaires?(?: (?:et|\/) financeurs)?|financeurs?|calendrier|[ée]ch[ée]ance|planning|[ée]tapes de mise en œuvre|temps de mise en œuvre|budget|co[uû]t(?: estim[ée])?|financements?|sources? de financements?(?: et subventions)?|subventions?|indicateurs?(?: de suivi)?|cibles?|publics? vis[ée]s?|moyens(?: humains| financiers)?|r[ée]sultats attendus|gains? estim[ée]s|impacts? de l['’]action|trajectoire|actions? op[ée]rationnelles?|priorit[ée]|statut|[ée]tat d['’]avancement|gains? (?:ges|[ée]nerg[ée]tiques?))\s*[:：]?\s*$/iu;
// « Axe : » ou « Axe : 2 » : la valeur d'un champ de fiche, pas une frontière.
const FIELD_VALUE = /^(?:axe|orientation|objectif)\s*[:：]/iu;

export type HeadingContext = {
  /** Police nettement plus grande que le corps du texte. */
  isLarge?: boolean;
  /** Le texte d'un titre Markdown : la marque dit déjà « titre ». */
  inMarkdown?: boolean;
};

/**
 * « Axe 2 — … », « Action 3 : … » : un titre qui dit son niveau, au contraire
 * d'une partie, d'une ligne en capitales ou d'un dièse.
 */
export const matchExplicitHeading = (
  text: string,
  context: HeadingContext = {}
): HeadingMatch | null => {
  const match = matchHeading(text, context);
  return match?.confidence === 1 &&
    match.kind !== 'section' &&
    match.kind !== 'markdown'
    ? match
    : null;
};

export const isFicheLabel = (text: string): boolean =>
  FICHE_LABEL.test(text.trim());

/** « Titre de l'action 1.1 … » : la fiche se dit action dans son cartouche. */
export const isFicheTitleField = (text: string): boolean =>
  FICHE_TITLE_FIELD.test(text.trim());

/** Un champ du cartouche dont la valeur, titre de fiche ou d'axe, peut passer à la ligne. */
export const isTitleField = (text: string): boolean =>
  isFicheTitleField(text) || AXE_FIELD.test(text.trim());

export const matchHeading = (
  text: string,
  { isLarge = false, inMarkdown = false }: HeadingContext = {}
): HeadingMatch | null => {
  const line = text.trim().replace(AXE_FIELD, '');
  // Une marque de titre vient de la structure (style Word, cellule de
  // tableau) : la longueur n'y prouve rien.
  if (
    line.length === 0 ||
    (line.length > MAX_TITLE_LENGTH && !MARKDOWN.test(line) && !inMarkdown) ||
    isSentence(line) ||
    FIELD_VALUE.test(line) ||
    isFicheLabel(line)
  ) {
    return null;
  }

  const markdown = line.match(MARKDOWN);
  if (markdown) {
    // Une page transcrite met en titre tout ce qui est en gras : un libellé
    // de champ (« ## Objectifs », « ## Cibles : les ménages ») n'en est pas un.
    // Le dièse dit « titre », le motif dit lequel : « # Axe 2 — … » reste un
    // axe, « # Fiche Action n°1.3 » une fiche.
    const text = markdown[2].trim();
    if (isFicheLabel(text.split(/[:：]/u)[0])) {
      return null;
    }
    const named = matchExplicitHeading(text, { inMarkdown: true });
    if (named) {
      // « # Enjeu 1 » puis « ## Objectif 1 » : le style Word garde son rang.
      return named.kind === 'axe' || named.kind === 'orientation'
        ? { ...named, level: Math.min(named.level, markdown[1].length) }
        : named;
    }
    return {
      kind: 'markdown',
      level: markdown[1].length,
      ...splitNumber(text),
      confidence: 1,
    };
  }
  const ficheTitle = line.match(FICHE_TITLE_FIELD);
  if (ficheTitle) {
    return {
      kind: 'fiche',
      level: FICHE_LEVEL,
      ...splitNumber(ficheTitle[1]),
      confidence: 1,
    };
  }
  const axe = line.match(AXE);
  const glued = line.match(AXE_GLUED_TO_TEXT)?.[1] ?? '';
  if (axe && /^\p{Ll}/u.test(glued) && isCutAtColumnEdge(glued)) {
    return null;
  }
  if (axe) {
    return {
      kind: 'axe',
      level: 1,
      number: axe[1],
      // « …les activitésAction 5.1 Accompagner… » : la colonne voisine, collée.
      title: axe[2].split(GLUED_NEXT_COLUMN)[0].trim(),
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
  // « mesure 1.5). Navette… » : en minuscule, un renvoi dans la phrase.
  if (fiche && (CHECK_MARKS.test(fiche[2].trim()) || /^\p{Ll}/u.test(line))) {
    return null;
  }
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

const isCutAtColumnEdge = (text: string): boolean =>
  /[-–]$/u.test(text.trim()) ||
  (text.match(/\(/gu)?.length ?? 0) > (text.match(/\)/gu)?.length ?? 0);

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

// « ## 2.3 Rénover » : le numéro reste exploitable derrière le dièse, même
// précédé d'un court libellé (« Groupe d'actions 1.1 — … »), comme « Axe 2 — ».
const splitNumber = (
  text: string
): { number: string | null; title: string } => {
  const match = text
    .trim()
    .match(
      /^(?:(?:\p{L}[\p{L}'’]*\s+){1,3}(?=\d{1,2}(?:\.\d{1,2})+\s*[.)\-–—:]))?(\d{1,2}(?:\.\d{1,2}){0,3})\s*[.)\-–—:]?\s+(.+)$/u
    );
  return match
    ? { number: match[1], title: match[2].trim() }
    : { number: null, title: text.trim() };
};
