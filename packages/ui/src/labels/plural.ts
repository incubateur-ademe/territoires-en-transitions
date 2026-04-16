type PluralForms = {
  zero?: string;
  one: string;
  other: string;
};

const pickForm = (forms: PluralForms, count: number): string => {
  const n = Number(count);
  if (forms.zero !== undefined && n === 0) return forms.zero;
  return n === 0 || n === 1 ? forms.one : forms.other;
};

/**
 * Retourne le mot accordé au singulier/pluriel sans le count.
 *
 * @example
 * const tache = plural({ one: 'tâche', other: 'tâches' });
 * tache({ count: 1 }); // "tâche"
 * tache({ count: 3 }); // "tâches"
 */
const plural = (
  forms: PluralForms
): ((params: { count: number }) => string) => {
  return ({ count }): string => pickForm(forms, count);
};

/**
 * Retourne "N mot" (count + mot accordé). Les formes `zero` sont renvoyées
 * telles quelles — elles portent déjà leur propre phrasing (ex: "Aucun filtre").
 *
 * @example
 * const filtre = countedPlural({
 *   zero: 'Aucun filtre',
 *   one: 'filtre',
 *   other: 'filtres',
 * });
 * filtre({ count: 0 }); // "Aucun filtre"  (forme `zero` brute, pas de "0" préfixé)
 * filtre({ count: 1 }); // "1 filtre"
 * filtre({ count: 3 }); // "3 filtres"
 */
const countedPlural = (
  forms: PluralForms
): ((params: { count: number }) => string) => {
  return ({ count }): string => {
    const n = Number(count);
    if (forms.zero !== undefined && n === 0) return forms.zero;
    return `${n} ${pickForm(forms, n)}`;
  };
};

const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

export { plural, countedPlural, capitalize, type PluralForms };
