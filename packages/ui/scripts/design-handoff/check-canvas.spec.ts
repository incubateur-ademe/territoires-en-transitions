import { describe, expect, it } from 'vitest';
import { checkCanvas, type CanvasFiles } from './check-canvas.ts';

const BUNDLE =
  '/* @ds-bundle: {"format":4,"namespace":"TeT","components":[{"name":"Button"},{"name":"Card"}]} */\n(function(){})();';

const boardOf = (body: string): string =>
  `<!doctype html><html><head><script src="./support.js"></script></head><body><x-dc>${body}</x-dc></body></html>`;

const canvasIndex = JSON.stringify({
  v: 3,
  boards: {
    'Main.dc.html': { x: 0, y: 0, w: 1280, h: 800, title: 'Page plan' },
  },
  notes: { a: { x: 0, y: 0, text: 'Proposition : une jauge de progression' } },
  designSystems: [{ namespace: 'tet', version: 'v7' }],
});

const filesOf = (body: string): CanvasFiles => ({
  'project/canvas.json': canvasIndex,
  'project/Main.dc.html': boardOf(body),
  'project/ds/tet/components/bundle.js': BUNDLE,
  'project/ds/tet/components/Button/preview.html': '<div></div>',
});

describe('checkCanvas', () => {
  it('rend les écarts, les propositions et la composition de chaque artboard', () => {
    const check = checkCanvas({
      files: filesOf(
        '<x-import component-from-global-scope="TeT.Button" variant="primary">Créer</x-import><div role="progressbar"></div>'
      ),
      currentDesignSystemVersion: 'v7',
    });

    expect(check.violations.map(({ rule, board }) => [rule, board])).toEqual([
      ['R1', 'Page plan'],
    ]);
    expect(check.proposals).toEqual(['Proposition : une jauge de progression']);
    expect(check.composition).toBe(
      '### Page plan\n\n- TeT.Button variant="primary" « Créer »'
    );
  });

  it('n’examine pas les artboards de la copie du design system', () => {
    const files = {
      ...filesOf('<p>Texte</p>'),
      'project/ds/tet/components/Cover/Cover.dc.html': boardOf(
        '<button>Interdit</button>'
      ),
    };
    expect(
      checkCanvas({ files, currentDesignSystemVersion: 'v7' }).violations
    ).toEqual([]);
  });

  it('signale un canevas sans design system installé', () => {
    const check = checkCanvas({
      files: { 'project/Main.dc.html': boardOf('<p>Texte</p>') },
      currentDesignSystemVersion: 'v7',
    });
    expect(check.designSystem.isInstalled).toBe(false);
    expect(check.violations.map(({ where }) => where)).toEqual([
      'design system',
    ]);
  });

  it('repère une copie du design system plus ancienne que la version publiée', () => {
    const files = filesOf('<p>Texte</p>');
    expect(
      checkCanvas({ files, currentDesignSystemVersion: 'v9' }).designSystem
    ).toEqual({ isInstalled: true, isCopyOutdated: true });
    expect(
      checkCanvas({ files, currentDesignSystemVersion: 'v7' }).designSystem
    ).toEqual({ isInstalled: true, isCopyOutdated: false });
  });

  it('ne conclut pas sans version courante à comparer', () => {
    expect(
      checkCanvas({
        files: filesOf('<p>Texte</p>'),
        currentDesignSystemVersion: undefined,
      }).designSystem.isCopyOutdated
    ).toBeUndefined();
  });
});
