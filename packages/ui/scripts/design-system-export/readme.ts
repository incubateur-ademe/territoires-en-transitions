/** Marqueur du brand book remplacé par les règles de conformité. */
export const RULES_MARKER =
  "<!-- rules.md : règles de conformité, insérées par l'export -->";

const RULE_ID = /^- \*\*(R\d+) ·/gm;

/** Numéros des règles (`R1`, `R2`…) dans l'ordre de `rules.md`. */
export const listRuleIds = (rules: string): ReadonlyArray<string> =>
  Array.from(rules.matchAll(RULE_ID), ([, id]) => id);

/**
 * README publié du design system : le brand book, avec les règles de
 * conformité à la place de son marqueur. Les règles n'existent qu'une fois,
 * dans `rules.md` ; le README de Claude Design en reçoit une copie à chaque
 * export.
 */
export const buildReadme = ({
  brandBook,
  rules,
}: Readonly<{ brandBook: string; rules: string }>): string => {
  if (!brandBook.includes(RULES_MARKER)) {
    throw new Error(
      `brand-book.md : marqueur des règles absent (${RULES_MARKER})`
    );
  }
  if (listRuleIds(rules).length === 0) {
    throw new Error('rules.md : aucune règle « - **Rn · … » trouvée');
  }
  return brandBook.replace(RULES_MARKER, rules.trim());
};
