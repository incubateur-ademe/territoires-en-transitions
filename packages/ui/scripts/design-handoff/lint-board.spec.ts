import { describe, expect, it } from 'vitest';
import type { BundleHeader } from './canvas-index.ts';
import { lintBoard } from './lint-board.ts';

const designSystem: BundleHeader = {
  namespace: 'TeT',
  componentNames: new Set(['Button', 'Badge', 'Card']),
};

const boardOf = (body: string, helmet = ''): string => `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><script src="./support.js"></script></head>
<body>
<x-dc>
<helmet><style>${helmet}</style></helmet>
${body}
</x-dc>
</body>
</html>`;

const lint = (body: string, helmet?: string) =>
  lintBoard({
    board: 'Main.dc.html',
    html: boardOf(body, helmet),
    designSystem,
  });

const rulesOf = (body: string, helmet?: string) =>
  lint(body, helmet).map(({ rule }) => rule);

describe('une maquette conforme', () => {
  it('ne produit aucun écart', () => {
    expect(
      lint(
        `<x-import component-from-global-scope="TeT.Card">
          <div style="display: flex; flex-direction: column; gap: 16px; padding: 24px">
            <h2>Plan d'action</h2>
            <p class="paragraphe-14">Trois fiches en retard</p>
            <x-import component-from-global-scope="TeT.Button" variant="primary">Enregistrer</x-import>
          </div>
        </x-import>`,
        'body{margin:0} a{color:var(--primary-7)}'
      )
    ).toEqual([]);
  });
});

describe('R1 : composants du design system uniquement', () => {
  it('refuse un widget fait à la main et dit où il est', () => {
    expect(lint('<button>Valider</button>')).toEqual([
      {
        rule: 'R1',
        board: 'Main.dc.html',
        where: '<button> « Valider »',
        message:
          '<button> fait à la main ; utiliser le composant du design system',
      },
    ]);
  });

  it('refuse un rôle ARIA de widget, une icône svg et un tableau', () => {
    expect(
      rulesOf(
        '<div role="progressbar"></div><svg></svg><table><tbody></tbody></table>'
      )
    ).toEqual(['R1', 'R1', 'R1']);
  });

  it('refuse un composant absent du design system ou d’un autre espace de noms', () => {
    expect(
      lint(
        '<x-import component-from-global-scope="TeT.Jauge"></x-import><x-import component-from-global-scope="Cds.Button"></x-import>'
      ).map(({ where, message }) => [where, message])
    ).toEqual([
      [
        '<x-import TeT.Jauge>',
        "TeT.Jauge n'est pas dans les composants du design system",
      ],
      [
        '<x-import Cds.Button>',
        "Cds.Button n'est pas un composant du design system",
      ],
    ]);
  });

  it('accepte un composant présent dans le design system', () => {
    expect(
      rulesOf('<x-import component-from-global-scope="TeT.Card"></x-import>')
    ).toEqual([]);
  });

  it('refuse une surface arrondie ou ombrée sur un élément ordinaire, pas sur un composant', () => {
    expect(
      rulesOf('<div style="border-radius: var(--radius-lg)">Carte</div>')
    ).toEqual(['R1']);
    expect(
      rulesOf(
        '<x-import component-from-global-scope="TeT.Card" style="border-radius: var(--radius-lg)"></x-import>'
      )
    ).toEqual([]);
  });

  it('refuse une interface construite en script', () => {
    const body = `<script type="text/x-dc" data-dc-script>
      class Component extends DCLogic {
        renderVals() { window.Jauge = () => null; return {}; }
      }
    </script>`;
    expect(rulesOf(body)).toEqual(['R1']);
  });

  it('accepte un script qui ne fait que fournir des valeurs', () => {
    const body = `<script type="text/x-dc" data-dc-script>
      class Component extends DCLogic { renderVals() { return { yes: true }; } }
    </script>`;
    expect(rulesOf(body)).toEqual([]);
  });

  it('ne contrôle pas les composants quand le design system est absent', () => {
    expect(
      lintBoard({
        board: 'Main.dc.html',
        html: boardOf(
          '<x-import component-from-global-scope="Cds.Button"></x-import>'
        ),
        designSystem: undefined,
      })
    ).toEqual([]);
  });
});

describe('R2, R3 et R4 dans les styles en ligne', () => {
  it('range chaque écart sous sa règle', () => {
    expect(
      lint(
        '<div style="margin-top: 12px; gap: 12px; font-size: 18px; color: #3a3a3a">Titre</div>'
      ).map(({ rule }) => rule)
    ).toEqual(['R2', 'R3', 'R4', 'R3']);
  });
});

describe('les styles de la page', () => {
  it('contrôle les règles du bloc style, avec le sélecteur pour repère', () => {
    expect(lint('<p>Texte</p>', 'a{color:#666}')).toEqual([
      {
        rule: 'R3',
        board: 'Main.dc.html',
        where: '<style> a',
        message:
          'color : une couleur en dur (#666) ; utiliser un token du design system',
      },
    ]);
  });

  it('laisse passer body{margin:0} et les @font-face', () => {
    expect(
      rulesOf(
        '<p>Texte</p>',
        "body{margin:0} @font-face{font-family:'Marianne';src:url(/_blob/abc)}"
      )
    ).toEqual([]);
  });
});
