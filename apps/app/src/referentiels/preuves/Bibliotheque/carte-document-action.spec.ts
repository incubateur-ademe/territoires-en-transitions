import { describe, expect, it } from 'vitest';
import {
  CarteDocumentAction,
  isActionCarriedBy,
} from './carte-document-action';
import { PreuveType } from '@tet/domain/collectivites';
import { DocumentRattache } from './types';

const PREUVE_TYPES: readonly PreuveType[] = [
  'reglementaire',
  'complementaire',
  'annexe',
  'labellisation',
  'audit',
  'rapport',
];

const preuveTypesCarrying = (
  action: CarteDocumentAction,
  type: DocumentRattache['type'] = 'fichier'
): PreuveType[] =>
  PREUVE_TYPES.filter((preuveType) =>
    isActionCarriedBy(action, { preuveType, type })
  );

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

  it("un document dont le fichier est introuvable ne porte pas l'edition", () => {
    expect(preuveTypesCarrying('edit', 'fichierManquant')).toEqual([]);
  });

  it('un document dont le fichier est introuvable reste commentable et supprimable', () => {
    expect(preuveTypesCarrying('comment', 'fichierManquant')).toEqual(
      PREUVE_TYPES
    );
    expect(preuveTypesCarrying('delete', 'fichierManquant')).toEqual([
      'reglementaire',
      'complementaire',
      'annexe',
      'labellisation',
      'rapport',
    ]);
  });
});
