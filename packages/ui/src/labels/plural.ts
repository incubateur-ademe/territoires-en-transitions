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
 * Retourne le mot accordé au singulier/pluriel.
 *
 * - Avec `count` : retourne "N mot" (count + mot accordé).
 *   Les formes `zero` sont renvoyées telles quelles.
 * - Avec `plural: true` : retourne la forme plurielle (`other`).
 * - Sans paramètre ou `plural: false` : retourne la forme singulière (`one`).
 *
 * @example
 * const filtre = plural({
 *   zero: 'Aucun filtre',
 *   one: 'filtre',
 *   other: 'filtres',
 * });
 *
 * filtre({ count: 0 }); // "Aucun filtre"
 * filtre({ count: 1 }); // "1 filtre"
 * filtre({ count: 3 }); // "3 filtres"
 *
 * filtre();               // "filtre"
 * filtre({ plural: true });  // "filtres"
 * filtre({ plural: false }); // "filtre"
 */
const plural = (
  forms: PluralForms
): ((params?: { count?: number; plural?: boolean }) => string) => {
  return (params): string => {
    if (params && 'count' in params && params.count !== undefined) {
      const n = Number(params.count);
      if (forms.zero !== undefined && n === 0) return forms.zero;
      return `${n} ${pickForm(forms, n)}`;
    }

    if (params && 'plural' in params && params.plural !== undefined) {
      return params.plural ? forms.other : forms.one;
    }

    return forms.one;
  };
};

const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

export { capitalize, plural, type PluralForms };
