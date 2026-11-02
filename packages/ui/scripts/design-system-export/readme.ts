export const RULES_MARKER =
  "<!-- rules.md : règles de conformité, insérées par l'export -->";

const RULE_ID = /^- \*\*(R\d+) ·/gm;

export const listRuleIds = (rules: string): ReadonlyArray<string> =>
  Array.from(rules.matchAll(RULE_ID), ([, id]) => id);

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
