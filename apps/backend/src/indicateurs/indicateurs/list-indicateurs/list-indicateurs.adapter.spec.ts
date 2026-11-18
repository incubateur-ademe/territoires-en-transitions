import { describe, expect, it } from 'vitest';
import { toPublicApiParents } from './list-indicateurs.adapter';

const toAncestor = (id: number) => ({
  id,
  identifiantReferentiel: `cae_${id}`,
  titre: `Titre ${id}`,
  titreCourt: null,
});

describe('toPublicApiParents', () => {
  it('ne renvoie aucun parent pour une racine', () => {
    expect(toPublicApiParents([])).toEqual([]);
  });

  it('renvoie le parent sans grand-parent pour un seul ancêtre', () => {
    expect(toPublicApiParents([toAncestor(1)])).toEqual([
      { ...toAncestor(1), parent: null },
    ]);
  });

  it('imbrique le grand-parent dans le parent pour deux ancêtres', () => {
    expect(toPublicApiParents([toAncestor(1), toAncestor(2)])).toEqual([
      { ...toAncestor(2), parent: { ...toAncestor(1), parent: null } },
    ]);
  });

  it('expose le parent direct et son propre parent pour un indicateur à trois niveaux ou plus', () => {
    expect(
      toPublicApiParents([toAncestor(1), toAncestor(2), toAncestor(3)])
    ).toEqual([
      { ...toAncestor(3), parent: { ...toAncestor(2), parent: null } },
    ]);
  });
});
