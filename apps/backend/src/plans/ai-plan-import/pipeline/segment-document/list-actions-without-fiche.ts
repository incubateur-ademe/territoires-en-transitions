import type { ActionsWithoutFicheDoubt } from '../../models/import-question';
import type { DocumentUnit } from './document-unit';

// Les engagements des partenaires décrivent ce que d'autres feront, pas le
// plan de la collectivité : une partie ainsi titrée n'est pas lue.
const PARTNER_SECTION = /partenaire/i;
// Un plan range ses fiches dans une partie à part (programme d'actions,
// fiches actions), après le diagnostic et la stratégie : quand cette partie
// est titrée et contient des fiches, le reste du document n'a pas d'action à
// donner. Il ne sert plus qu'au squelette.
const ACTION_PLAN_SECTION =
  /(?:plan|programme) d['’]actions?|fiches?[\s-]actions?|catalogue des actions|plan op[ée]rationnel/i;
// « Feuille de route mobilité », « Fiches projets » : une partie d'un plan
// plus large, qui n'en réunit pas toujours toutes les fiches. Seule la prose
// hors de cette partie est écartée ; ses autres fiches passent au tri.
const PARTIAL_ACTION_PLAN_SECTION =
  /fiches?[\s-]projets?|programme op[ée]rationnel|feuille de route/i;
const MIN_FICHES_IN_ACTION_PLAN = 3;
// « Action à engager 31 : … », « Mesure 4.2 – … » : une ligne d'un tableau
// récapitulatif, avec son numéro.
const NUMBERED_ACTION =
  /^(?:actions?|mesures?|op[ée]rations?|projets?)\b[^:\n]{0,30}?(\d+(?:\.\d+)*)\s*[:.–—-]/iu;
// Un récapitulatif qui numérote nettement plus d'actions qu'il n'y a de
// fiches en porte que nulle fiche ne détaille.
const MIN_ACTIONS_WITHOUT_FICHE = 3;
const ACTIONS_WITHOUT_FICHE_RATIO = 1.25;
const FICHE_NUMBER = /^(\d+(?:\.\d+)*)\b/u;

/**
 * Les unités que le tri lit : sans la partie des partenaires, et seulement
 * la partie des fiches quand le document en titre une. `readable` garde le
 * reste, qui peut encore servir au squelette.
 */
export const selectActionPlanUnits = (
  allUnits: DocumentUnit[]
): { readable: DocumentUnit[]; units: DocumentUnit[] } => {
  const readable = allUnits.filter(
    (unit) => !unit.section || !PARTNER_SECTION.test(unit.section)
  );
  const inPart = (pattern: RegExp) =>
    readable.filter((unit) => unit.section && pattern.test(unit.section));
  const holdsFiches = (part: DocumentUnit[]) =>
    part.filter((unit) => unit.kind === 'fiche').length >=
    MIN_FICHES_IN_ACTION_PLAN;
  const actionPlan = inPart(ACTION_PLAN_SECTION);
  const partialPlan = inPart(PARTIAL_ACTION_PLAN_SECTION);
  const units = holdsFiches(actionPlan)
    ? actionPlan
    : holdsFiches(partialPlan)
    ? readable.filter(
        (unit) => partialPlan.includes(unit) || unit.kind === 'fiche'
      )
    : readable;
  return { readable, units };
};

/** Page affichée, à partir de 1. */
type NumberedAction = { numero: string; text: string; page: number };

const numberedActionsOf = (unit: DocumentUnit): NumberedAction[] =>
  unit.lines.flatMap((line) =>
    line.text.split('\n').flatMap((text) => {
      const numero = text.trim().match(NUMBERED_ACTION)?.[1];
      return numero
        ? [{ numero, text: text.trim(), page: line.pageIndex + 1 }]
        : [];
    })
  );

/** Un tableau récapitulatif : hors des fiches, il numérote plusieurs actions. */
export const isActionsSummary = (unit: DocumentUnit): boolean =>
  unit.kind !== 'fiche' &&
  numberedActionsOf(unit).length >= MIN_ACTIONS_WITHOUT_FICHE;

export const countFiches = (units: DocumentUnit[]): number =>
  // Une fiche découpée en fenêtres reste une fiche.
  units.filter((unit) => unit.kind === 'fiche' && !unit.continued).length;

/** Les lignes qui numérotent une action (« Action 12 : … »), où qu'elles soient. */
export const countNumberedActions = (units: DocumentUnit[]): number =>
  units.reduce((total, unit) => total + numberedActionsOf(unit).length, 0);

/** Chaque numéro d'action des récapitulatifs, à sa première ligne. */
const listedActionsOf = (
  units: DocumentUnit[]
): Map<string, NumberedAction> => {
  const listed = new Map<string, NumberedAction>();
  for (const action of units
    .filter((unit) => unit.kind !== 'fiche')
    .flatMap(numberedActionsOf)) {
    if (!listed.has(action.numero)) {
      listed.set(action.numero, action);
    }
  }
  return listed;
};

const listsMoreThanFiches = (listed: number, ficheCount: number): boolean =>
  ficheCount > 0 &&
  listed - ficheCount >= MIN_ACTIONS_WITHOUT_FICHE &&
  listed >= ACTIONS_WITHOUT_FICHE_RATIO * ficheCount;

/**
 * Les tableaux à garder malgré les fiches, quoi qu'en dise le tri : ensemble,
 * ils numérotent plus d'actions que le document n'a de fiches (51 actions au
 * tableau, 24 fiches pour les seules actions nouvelles). Le tri ne voit que
 * le début et la fin d'un extrait ; le compte, lui, porte sur toutes ses
 * lignes. Un récapitulatif qui redit les fiches, à peu près autant qu'elles,
 * reste écarté.
 */
export const listActionsWithoutFiche = (
  units: DocumentUnit[]
): ((unit: DocumentUnit) => boolean) => {
  const hasMore = listsMoreThanFiches(
    listedActionsOf(units).size,
    countFiches(units)
  );
  return (unit) => hasMore && isActionsSummary(unit);
};

/**
 * Le récapitulatif liste des actions que nulle fiche ne détaille : faut-il
 * les créer, avec leur seul titre ? Le périmètre est celui du tri, pour que
 * la question et les tableaux gardés ne divergent jamais. Les numéros des
 * fiches doivent s'y retrouver pour la moitié au moins : sans appariement,
 * rien ne dit quelles actions n'ont pas de fiche, et la question se tait.
 */
export const detectActionsWithoutFicheDoubt = (
  allUnits: DocumentUnit[]
): ActionsWithoutFicheDoubt | null => {
  const { units } = selectActionPlanUnits(allUnits);
  const ficheCount = countFiches(units);
  const listed = listedActionsOf(units);
  if (!listsMoreThanFiches(listed.size, ficheCount)) {
    return null;
  }
  const ficheNumbers = new Set(
    units.flatMap((unit) =>
      unit.kind === 'fiche' && !unit.continued
        ? unit.title?.trim().match(FICHE_NUMBER)?.[1] ?? []
        : []
    )
  );
  const withFiche = [...ficheNumbers].filter((numero) => listed.has(numero));
  const withoutFiche = [...listed.values()].filter(
    ({ numero }) => !ficheNumbers.has(numero)
  );
  if (
    withFiche.length < ficheCount / 2 ||
    withoutFiche.length < MIN_ACTIONS_WITHOUT_FICHE
  ) {
    return null;
  }
  const [example] = withoutFiche;
  return {
    kind: 'actions-without-fiche',
    listed: listed.size,
    withFiche: listed.size - withoutFiche.length,
    withoutFiche: withoutFiche.length,
    example: { title: example.text, page: example.page },
    tablePages: [
      ...new Set(
        units
          .filter(isActionsSummary)
          .flatMap(numberedActionsOf)
          .map(({ page }) => page)
      ),
    ].sort((a, b) => a - b),
    proposed: 'all',
  };
};
