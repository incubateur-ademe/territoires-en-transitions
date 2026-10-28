/*
 * Fonctions pures de l'export des composants : inventaire des stories,
 * source du point d'entrée du bundle, en-tête du bundle, preview.html et
 * README de chaque composant. Les lectures de fichiers et le build sont dans
 * `build-components.mts`.
 */

export const NAMESPACE = 'TeT';

/** `WithHoverActions` → `With hover actions`. */
export const toStoryLabel = (exportName: string): string =>
  exportName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^./, (first) => first.toUpperCase());

/** Une story Storybook telle que lue dans son module (côté Node). */
export type StoryFile = Readonly<{
  /** Chemin relatif à `packages/ui` (`src/design-system/Button/Button.stories.tsx`). */
  path: string;
  title: string | undefined;
  componentName: string | undefined;
  /** Exports de stories, dans l'ordre de déclaration du fichier. */
  storyExports: ReadonlyArray<string>;
}>;

/** Un composant publié : une carte, un dossier `components/<name>/`. */
export type PublishedComponent = Readonly<{
  name: string;
  group: string;
  storyFiles: ReadonlyArray<StoryFile>;
}>;

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** `split-button.stories.tsx` → `SplitButton`. */
export const toPascalCase = (value: string): string =>
  value
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join('');

const storyBaseName = (path: string): string =>
  path
    .split('/')
    .at(-1)
    ?.replace(/\.stories\.tsx?$/, '') ?? path;

/** Lit un fichier de stories : composant et titre du meta, exports de stories. */
export const parseStoryFile = (path: string, source: string): StoryFile => {
  const metaSource = source.split(/^export default/m)[0] ?? source;
  return {
    path,
    // propriétés de premier niveau du meta (indentées de deux espaces)
    title: /^ {2}title:\s*'([^']+)'/m.exec(metaSource)?.[1],
    componentName: /^ {2}component:\s*([A-Za-z_$][\w$]*)/m.exec(
      metaSource
    )?.[1],
    storyExports: exportedConstNames(source).filter((name) => name !== 'meta'),
  };
};

/** Nom de la carte : le composant du meta, sinon le titre, sinon le fichier. */
export const componentNameOf = (file: StoryFile): string => {
  const fromTitle = file.title?.split('/').at(-1);
  const candidates = [
    file.componentName,
    fromTitle && toPascalCase(fromTitle),
    toPascalCase(storyBaseName(file.path)),
  ];
  return (
    candidates.find(
      (name): name is string => !!name && IDENTIFIER.test(name)
    ) ?? 'Component'
  );
};

/** Groupe de la carte : premier segment du titre, sinon le dossier source. */
export const groupOf = (file: StoryFile): string =>
  file.title?.split('/')[0]?.trim() ||
  (file.path.startsWith('src/components/') ? 'Components' : 'Design System');

/**
 * Regroupe les fichiers de stories par composant ; deux fichiers qui
 * désigneraient le même nom pour des dossiers différents restent distincts
 * (le second prend le nom de son fichier).
 */
export const groupStoryFiles = (
  files: ReadonlyArray<StoryFile>
): ReadonlyArray<PublishedComponent> =>
  files
    .filter((file) => file.storyExports.length > 0)
    .reduce<ReadonlyArray<PublishedComponent>>((components, file) => {
      const name = componentNameOf(file);
      const folder = (path: string) => path.split('/').slice(0, -1).join('/');
      const sameName = components.find((component) => component.name === name);
      if (!sameName) {
        return [
          ...components,
          { name, group: groupOf(file), storyFiles: [file] },
        ];
      }
      if (
        sameName.storyFiles.some(
          (other) => folder(other.path) === folder(file.path)
        )
      ) {
        return components.map((component) =>
          component === sameName
            ? { ...component, storyFiles: [...component.storyFiles, file] }
            : component
        );
      }
      const fallback = toPascalCase(storyBaseName(file.path));
      return [
        ...components,
        {
          name: fallback === name ? `${name}2` : fallback,
          group: groupOf(file),
          storyFiles: [file],
        },
      ];
    }, [])
    .slice()
    .sort(
      (a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name)
    );

/**
 * Lignes d'export publiques de `src/index.ts`, chemins rendus absolus, sans
 * les modules écartés (tracking lié à `@tet/api`, composants dépréciés).
 */
export const publicExportLines = (
  indexSource: string,
  srcDir: string,
  isExcluded: (modulePath: string) => boolean
): ReadonlyArray<string> =>
  indexSource.split('\n').flatMap((line) => {
    const match = /^export (.+) from '\.\/(.+)';$/.exec(line.trim());
    if (!match) return [];
    const [, what, modulePath] = match;
    return modulePath && !isExcluded(modulePath)
      ? [`export ${what} from '${srcDir}/${modulePath}';`]
      : [];
  });

/** Source du point d'entrée : API publique, stories composées, aperçu. */
export const entrySource = ({
  exportLines,
  components,
  uiDir,
  previewModule,
}: Readonly<{
  exportLines: ReadonlyArray<string>;
  components: ReadonlyArray<PublishedComponent>;
  uiDir: string;
  previewModule: string;
}>): string => {
  const storyImports = components.flatMap((component, componentIndex) =>
    component.storyFiles.map(
      (file, fileIndex) =>
        `import * as S${componentIndex}_${fileIndex} from '${uiDir}/${file.path}';`
    )
  );
  const storyEntries = components.map(
    (component, componentIndex) =>
      `  ${component.name}: [${component.storyFiles
        .map(
          (file, fileIndex) =>
            `...composeStories(S${componentIndex}_${fileIndex}, ${JSON.stringify(
              file.storyExports
            )})`
        )
        .join(', ')}],`
  );
  return [
    ...exportLines,
    `import { composeStories, renderStories } from '${previewModule}';`,
    ...storyImports,
    'const stories = {',
    ...storyEntries,
    '};',
    'export const __preview = {',
    '  render: (element, name) => renderStories(element, stories[name] ?? []),',
    '  components: Object.keys(stories),',
    '};',
    '',
  ].join('\n');
};

/** Ligne 1 du bundle : namespace et ordre des composants. */
export const bundleHeader = (
  components: ReadonlyArray<PublishedComponent>,
  bundleExports: ReadonlySet<string>
): string =>
  `/* @ds-bundle: ${JSON.stringify({
    format: 4,
    namespace: NAMESPACE,
    components: components
      .filter(({ name }) => bundleExports.has(name))
      .map(({ name }) => ({ name })),
  })} */`;

/**
 * Le bundle est inliné par ses consommateurs dans un `<script>` : ni
 * `</script` ni `<!--` ne doivent y apparaître en clair. Le caractère de
 * remplacement U+FFFD, que des dépendances laissent en clair dans leurs
 * chaînes et regex, est refusé à la publication : il est écrit `\uFFFD`.
 */
export const escapeForInlineScript = (code: string): string =>
  code
    .replace(/<\/script/gi, '<\\/script')
    .replace(/<!--/g, '\\x3C!--')
    .replace(/\uFFFD/g, '\\uFFFD');

const escapeAttribute = (value: string): string => value.replace(/"/g, "'");

/**
 * Carte d'un composant exporté par le bundle, ou planche d'exemples (`page`)
 * quand les stories composent plusieurs composants sans en exporter un seul.
 */
export const previewHtml = (
  component: PublishedComponent,
  isBundleExport: boolean
): string => {
  const storyCount = component.storyFiles.reduce(
    (count, file) => count + file.storyExports.length,
    0
  );
  return [
    `<!-- @dsCard group="${escapeAttribute(
      component.group
    )}" height=320 subtitle="${storyCount} ${
      storyCount > 1 ? 'exemples' : 'exemple'
    } issus des stories"${isBundleExport ? '' : ' page'} -->`,
    '<div id="root"></div>',
    '<script>',
    `  window.${NAMESPACE}.__preview.render(document.getElementById('root'), ${JSON.stringify(
      component.name
    )});`,
    '</script>',
    '',
  ].join('\n');
};

/** Noms des `export const` d'un fichier, dans l'ordre de déclaration. */
export const exportedConstNames = (source: string): ReadonlyArray<string> =>
  [...source.matchAll(/^export const (\w+)/gm)].flatMap((match) =>
    match[1] ? [match[1]] : []
  );

/** Commentaire JSDoc placé juste au-dessus de `export const <name>`. */
export const jsDocAbove = (
  source: string,
  name: string
): string | undefined => {
  const match = new RegExp(
    `/\\*\\*((?:[^*]|\\*(?!/))*)\\*/\\s*export (?:const|function|class) ${name}\\b`
  ).exec(source);
  const text = match?.[1]
    ?.split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean)
    .join(' ');
  return text || undefined;
};

export type ReadmeInput = Readonly<{
  component: PublishedComponent;
  isBundleExport: boolean;
  summary: string | undefined;
  storyDocs: ReadonlyArray<
    Readonly<{ label: string; doc: string | undefined }>
  >;
  sourceDir: string;
}>;

export const componentReadme = ({
  component,
  isBundleExport,
  summary,
  storyDocs,
  sourceDir,
}: ReadmeInput): string =>
  [
    summary ??
      (isBundleExport
        ? `\`${component.name}\`, composant de \`@tet/ui\`.`
        : `Planche d’exemples de \`@tet/ui\` (\`packages/ui/${sourceDir}\`).`),
    '',
    isBundleExport
      ? `Dans le code : \`import { ${component.name} } from '@tet/ui';\` (\`packages/ui/${sourceDir}\`). Ses props sont décrites dans \`${component.name}.d.ts\`.`
      : `Ces exemples composent des composants de \`@tet/ui\` ; \`${component.name}\` n’est pas un export de la bibliothèque. Les types du dossier sont dans \`${component.name}.d.ts\`.`,
    '',
    'Exemples de l’aperçu, tirés des stories :',
    '',
    ...storyDocs.map(
      ({ label, doc }) => `- **${label}**${doc ? ` : ${doc}` : ''}`
    ),
    '',
  ].join('\n');

/** Déclarations d'un `.d.ts` émis par tsc, sans imports ni source map. */
export const stripDeclarationFile = (dts: string): string =>
  dts
    .split('\n')
    .filter(
      (line) =>
        !/^import\s/.test(line) &&
        !/^\/\/# sourceMappingURL=/.test(line) &&
        line.trim() !== 'export {};'
    )
    .join('\n')
    .trim();
