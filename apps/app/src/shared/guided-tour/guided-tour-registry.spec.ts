import { afterEach, describe, expect, it } from 'vitest';
import { createGuidedTourRegistry } from './guided-tour-registry';

const attachElement = (label: string): HTMLElement => {
  const element = document.createElement('div');
  element.textContent = label;
  return document.body.appendChild(element);
};

afterEach(() => {
  document.body.replaceChildren();
});

describe('createGuidedTourRegistry', () => {
  it("résout le premier élément dans l'ordre du document, même enregistré après un autre", () => {
    const registry = createGuidedTourRegistry();
    const first = attachElement('premier');
    const second = attachElement('second');

    registry.register({ tourId: 'tour', targetId: 'anchor', element: second });
    registry.register({ tourId: 'tour', targetId: 'anchor', element: first });

    expect(registry.resolve('tour', 'anchor')()).toBe(first);
  });

  it("retombe sur l'élément suivant quand le premier est désenregistré", () => {
    const registry = createGuidedTourRegistry();
    const first = attachElement('premier');
    const second = attachElement('second');
    const unregisterFirst = registry.register({
      tourId: 'tour',
      targetId: 'anchor',
      element: first,
    });
    registry.register({ tourId: 'tour', targetId: 'anchor', element: second });

    unregisterFirst();

    expect(registry.resolve('tour', 'anchor')()).toBe(second);
  });

  it("ne résout rien tant qu'aucun élément n'est enregistré, puis résout l'élément enregistré plus tard", () => {
    const registry = createGuidedTourRegistry();
    const resolveAnchor = registry.resolve('tour', 'anchor');
    const element = attachElement('tardif');

    const beforeRegister = resolveAnchor();
    registry.register({ tourId: 'tour', targetId: 'anchor', element });

    expect({ beforeRegister, afterRegister: resolveAnchor() }).toEqual({
      beforeRegister: null,
      afterRegister: element,
    });
  });

  it("n'attribue à chaque visite que sa propre cible quand visite et cible se recomposent en la même chaîne", () => {
    const registry = createGuidedTourRegistry();
    const tourWithDotElement = attachElement('visite pointée');
    const targetWithDotElement = attachElement('cible pointée');

    registry.register({
      tourId: 'a.b',
      targetId: 'c',
      element: tourWithDotElement,
    });
    registry.register({
      tourId: 'a',
      targetId: 'b.c',
      element: targetWithDotElement,
    });

    expect({
      targetWithDot: registry.resolve('a', 'b.c')(),
      tourWithDot: registry.resolve('a.b', 'c')(),
    }).toEqual({
      targetWithDot: targetWithDotElement,
      tourWithDot: tourWithDotElement,
    });
  });
});
