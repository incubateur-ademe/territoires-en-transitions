import { isValidElement, type ReactNode } from 'react';
import { ficheActionFixture } from '../__tests__/__fixtures__/fiche-81152.fixture';
import Indicateurs from './Indicateurs';

const collectNormalizedText = (node: ReactNode): string[] => {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return [];
  }

  if (typeof node === 'string' || typeof node === 'number') {
    const normalized = String(node).replace(/\s+/g, ' ').trim();
    return normalized.length > 0 ? [normalized] : [];
  }

  if (Array.isArray(node)) {
    return node.flatMap((child) => collectNormalizedText(child));
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return collectNormalizedText(node.props.children);
  }

  return [];
};

describe('Indicateurs PDF section', () => {
  test('uses a single "Indicateurs liés" heading for the actual indicator list', () => {
    const tree = Indicateurs({
      fiche: ficheActionFixture.fiche,
      indicateursListe: ficheActionFixture.indicateursListe,
    });

    const texts = collectNormalizedText(tree);

    expect(texts.filter((text) => text === 'Indicateurs liés')).toHaveLength(1);
    expect(texts).not.toContain('Indicateurs associés :');
    expect(texts).toContain('Objectifs :');
  });
});