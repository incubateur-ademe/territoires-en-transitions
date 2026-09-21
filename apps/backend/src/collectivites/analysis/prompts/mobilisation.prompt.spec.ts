import { describe, expect, it } from 'vitest';
import {
  CATEGORIE_LABELS,
  CATEGORIE_RANKS,
  CATEGORIES_IN_PROMPT_ORDER,
} from '../pipeline/calculate-mobilisation/volet-categories';
import { MOBILISATION_SYSTEM_INSTRUCTION } from './mobilisation.prompt';

describe('mobilisation.prompt', () => {
  it('numérote les catégories comme la table qui relit les notes', () => {
    const headings = CATEGORIES_IN_PROMPT_ORDER.map(
      (categorie) =>
        `${CATEGORIE_RANKS[categorie]}. ${CATEGORIE_LABELS[categorie]}`
    );

    const missingHeadings = headings.filter(
      (heading) => !MOBILISATION_SYSTEM_INSTRUCTION.includes(heading)
    );

    expect({ checkedHeadings: headings.length, missingHeadings }).toEqual({
      checkedHeadings: 6,
      missingHeadings: [],
    });
  });
});
