/**
 * Transforme une saisie libre en requête `to_tsquery` de préfixes :
 * `"nantes métro"` → `"nantes:* & métro:*"`.
 *
 * Seuls les lettres et chiffres sont conservés, ce qui écarte les opérateurs
 * de la syntaxe tsquery (`&`, `|`, `!`, `:`…). Renvoie `null` si rien ne reste.
 */
export function buildPrefixTsquery(search: string): string | null {
  const tsquery = search
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean)
    .map((word) => `${word}:*`)
    .join(' & ');

  return tsquery || null;
}
