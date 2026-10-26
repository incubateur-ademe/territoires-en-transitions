import { describe, expect, it } from 'vitest';
import {
  bundleHeader,
  componentNameOf,
  componentReadme,
  entrySource,
  escapeForInlineScript,
  exportedConstNames,
  groupStoryFiles,
  jsDocAbove,
  parseStoryFile,
  previewHtml,
  publicExportLines,
  stripDeclarationFile,
  StoryFile,
  toStoryLabel,
} from './components';

const storyFile = (overrides: Partial<StoryFile>): StoryFile => ({
  path: 'src/design-system/Button/Button.stories.tsx',
  title: undefined,
  componentName: 'Button',
  storyExports: ['Default'],
  ...overrides,
});

describe('parseStoryFile', () => {
  const source = `
const meta: Meta<typeof Badge> = {
  component: Badge,
  title: 'Components/Badge',
  args: { title: 'Badge', variant: 'standard' },
};
export default meta;

/** Badge par défaut. */
export const Default: Story = {};
export const AvecIcone: Story = {};
`;

  it('lit le composant et le titre du meta, pas les args', () => {
    expect(parseStoryFile('src/x.stories.tsx', source)).toEqual({
      path: 'src/x.stories.tsx',
      title: 'Components/Badge',
      componentName: 'Badge',
      storyExports: ['Default', 'AvecIcone'],
    });
  });

  it("garde l'ordre de déclaration des exports", () => {
    expect(
      exportedConstNames('export const B = 1;\nexport const A = 2;')
    ).toEqual(['B', 'A']);
  });
});

describe('componentNameOf', () => {
  it('préfère le composant du meta, puis le titre, puis le fichier', () => {
    expect(componentNameOf(storyFile({}))).toBe('Button');
    expect(
      componentNameOf(
        storyFile({ componentName: undefined, title: 'Design System/Layout' })
      )
    ).toBe('Layout');
    expect(
      componentNameOf(
        storyFile({
          componentName: undefined,
          path: 'src/design-system/Button/split-button.stories.tsx',
        })
      )
    ).toBe('SplitButton');
  });
});

describe('groupStoryFiles', () => {
  it('regroupe les fichiers d’un même composant et trie par groupe puis nom', () => {
    const components = groupStoryFiles([
      storyFile({ path: 'src/design-system/Button/Button.stories.tsx' }),
      storyFile({ path: 'src/design-system/Button/Button.more.stories.tsx' }),
      storyFile({
        componentName: 'AppShell',
        path: 'src/components/layout/app-shell.stories.tsx',
      }),
      storyFile({ componentName: 'Empty', storyExports: [] }),
    ]);
    expect(
      components.map(({ name, group, storyFiles }) => [
        name,
        group,
        storyFiles.length,
      ])
    ).toEqual([
      ['AppShell', 'Components', 1],
      ['Button', 'Design System', 2],
    ]);
  });

  it('sépare deux composants homonymes de dossiers différents', () => {
    const components = groupStoryFiles([
      storyFile({
        componentName: 'Tabs',
        path: 'src/design-system/Tabs/Tabs.stories.tsx',
      }),
      storyFile({
        componentName: 'Tabs',
        path: 'src/design-system/TabsNext/tabs-next.stories.tsx',
      }),
    ]);
    expect(components.map(({ name }) => name)).toEqual(['Tabs', 'TabsNext']);
  });
});

describe('publicExportLines', () => {
  it('rend les chemins absolus et écarte les modules exclus', () => {
    const index = [
      "'use client';",
      "export * from './design-system/Button';",
      "export * from './components/tracking';",
      "export { preset } from './tailwind-preset';",
    ].join('\n');
    expect(
      publicExportLines(index, '/ui/src', (path) =>
        path.startsWith('components/tracking')
      )
    ).toEqual([
      "export * from '/ui/src/design-system/Button';",
      "export { preset } from '/ui/src/tailwind-preset';",
    ]);
  });
});

describe('entrySource', () => {
  it('importe chaque fichier de stories et les compose dans leur ordre', () => {
    const source = entrySource({
      exportLines: ["export * from '/ui/src/design-system/Button';"],
      components: groupStoryFiles([
        storyFile({ storyExports: ['Default', 'Disabled'] }),
      ]),
      uiDir: '/ui',
      previewModule: '/ui/scripts/story-preview.tsx',
    });
    expect(source).toContain(
      "import * as S0_0 from '/ui/src/design-system/Button/Button.stories.tsx';"
    );
    expect(source).toContain(
      'Button: [...composeStories(S0_0, ["Default","Disabled"])],'
    );
    expect(source).toContain('export const __preview = {');
  });
});

describe('bundleHeader', () => {
  it('ne liste que les composants exportés par le bundle', () => {
    const components = groupStoryFiles([
      storyFile({}),
      storyFile({
        componentName: undefined,
        title: 'Design System/Layout',
        path: 'src/l/l.stories.tsx',
      }),
    ]);
    expect(bundleHeader(components, new Set(['Button']))).toBe(
      '/* @ds-bundle: {"format":4,"namespace":"TeT","components":[{"name":"Button"}]} */'
    );
  });
});

describe('escapeForInlineScript', () => {
  it('neutralise les fins de script et les ouvertures de commentaire HTML', () => {
    expect(escapeForInlineScript('a="</script>";b="<!--"')).toBe(
      'a="<\\/script>";b="\\x3C!--"'
    );
  });
});

describe('previewHtml', () => {
  const [button] = groupStoryFiles([
    storyFile({ storyExports: ['Default', 'Disabled'] }),
  ]);

  it('marque la carte et monte les stories du composant', () => {
    const html = button ? previewHtml(button, true) : '';
    expect(html.split('\n')[0]).toBe(
      '<!-- @dsCard group="Design System" height=320 subtitle="2 exemples issus des stories" -->'
    );
    expect(html).toContain(
      'window.TeT.__preview.render(document.getElementById(\'root\'), "Button");'
    );
  });

  it('déclare une planche d’exemples quand le nom n’est pas un export', () => {
    expect(button ? previewHtml(button, false).split('\n')[0] : '').toContain(
      ' page -->'
    );
  });
});

describe('jsDocAbove', () => {
  it('lit le commentaire JSDoc placé au-dessus de l’export', () => {
    const source =
      '/**\n * Affiche un badge\n * coloré.\n */\nexport const Badge = () => null;';
    expect(jsDocAbove(source, 'Badge')).toBe('Affiche un badge coloré.');
    expect(jsDocAbove(source, 'Other')).toBeUndefined();
  });
});

describe('componentReadme', () => {
  const [button] = groupStoryFiles([storyFile({})]);

  it('donne l’import du composant et la liste des exemples', () => {
    const readme = button
      ? componentReadme({
          component: button,
          isBundleExport: true,
          summary: 'Bouton.',
          storyDocs: [{ label: 'Default', doc: 'Bouton par défaut.' }],
          sourceDir: 'src/design-system/Button',
        })
      : '';
    expect(readme.split('\n')[0]).toBe('Bouton.');
    expect(readme).toContain("`import { Button } from '@tet/ui';`");
    expect(readme).toContain('- **Default** : Bouton par défaut.');
  });
});

describe('toStoryLabel', () => {
  it('met en phrase un nom d’export', () => {
    expect(toStoryLabel('WithHoverActions')).toBe('With hover actions');
  });
});

describe('stripDeclarationFile', () => {
  it('retire imports, export vide et source map', () => {
    expect(
      stripDeclarationFile(
        "import { X } from './x';\nexport type P = { a: X };\nexport {};\n//# sourceMappingURL=a.d.ts.map"
      )
    ).toBe('export type P = { a: X };');
  });
});
