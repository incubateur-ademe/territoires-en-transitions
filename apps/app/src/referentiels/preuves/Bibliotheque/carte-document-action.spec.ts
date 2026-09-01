import { describe, expect, it } from 'vitest';
import {
  CarteDocumentAction,
  isActionCarriedBy,
} from './carte-document-action';
import { TPreuveType } from './types';

const PREUVE_TYPES: readonly TPreuveType[] = [
  'reglementaire',
  'complementaire',
  'annexe',
  'labellisation',
  'audit',
  'rapport',
];

const preuveTypesCarrying = (action: CarteDocumentAction): TPreuveType[] =>
  PREUVE_TYPES.filter((preuveType) => isActionCarriedBy(action, preuveType));

describe('isActionCarriedBy', () => {
  it("seul un rapport d'audit porte le remplacement de fichier", () => {
    expect(preuveTypesCarrying('replace')).toEqual(['audit']);
  });

  it("tout document sauf un rapport d'audit porte la suppression", () => {
    expect(preuveTypesCarrying('delete')).toEqual([
      'reglementaire',
      'complementaire',
      'annexe',
      'labellisation',
      'rapport',
    ]);
  });

  it("l'edition et le commentaire ne dependent pas du type de document", () => {
    expect(preuveTypesCarrying('edit')).toEqual(PREUVE_TYPES);
    expect(preuveTypesCarrying('comment')).toEqual(PREUVE_TYPES);
  });
});
