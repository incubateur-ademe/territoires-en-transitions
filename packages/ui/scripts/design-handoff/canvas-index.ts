export type DesignSystemRecord = Readonly<{
  namespace: string;
  version: string | undefined;
}>;

export type CanvasIndex = Readonly<{
  boardTitles: Readonly<Record<string, string>>;
  noteTexts: ReadonlyArray<string>;
  designSystems: ReadonlyArray<DesignSystemRecord>;
}>;

type JsonRecord = Readonly<Record<string, unknown>>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const recordOf = (value: unknown): JsonRecord => (isRecord(value) ? value : {});

const stringOf = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

export const emptyCanvasIndex: CanvasIndex = {
  boardTitles: {},
  noteTexts: [],
  designSystems: [],
};

export const parseCanvasIndex = (json: string): CanvasIndex => {
  const index = recordOf(JSON.parse(json));
  const boardTitles = Object.fromEntries(
    Object.entries(recordOf(index['boards'])).flatMap(([path, board]) => {
      const title = stringOf(recordOf(board)['title']);
      return title ? [[path, title]] : [];
    })
  );
  const noteTexts = Object.values(recordOf(index['notes'])).flatMap((note) => {
    const text = stringOf(recordOf(note)['text']);
    return text ? [text] : [];
  });
  const designSystems = (
    Array.isArray(index['designSystems']) ? index['designSystems'] : []
  ).flatMap((entry): ReadonlyArray<DesignSystemRecord> => {
    const record = recordOf(entry);
    const namespace = stringOf(record['namespace']);
    return namespace
      ? [{ namespace, version: stringOf(record['version']) }]
      : [];
  });
  return { boardTitles, noteTexts, designSystems };
};

const PROPOSAL_NOTE = /^\s*proposition\s*:/i;

export const proposalsOf = (
  noteTexts: ReadonlyArray<string>
): ReadonlyArray<string> =>
  noteTexts
    .filter((text) => PROPOSAL_NOTE.test(text))
    .map((text) => text.trim());

export type BundleHeader = Readonly<{
  namespace: string;
  componentNames: ReadonlySet<string>;
}>;

const BUNDLE_HEADER = /^\/\* @ds-bundle: (.+) \*\//;

export const parseBundleHeader = (
  bundleSource: string
): BundleHeader | undefined => {
  const firstLine = bundleSource.split('\n', 1)[0] ?? '';
  const json = BUNDLE_HEADER.exec(firstLine)?.[1];
  if (!json) return undefined;
  const header = recordOf(JSON.parse(json));
  const namespace = stringOf(header['namespace']);
  if (!namespace) return undefined;
  const components = Array.isArray(header['components'])
    ? header['components']
    : [];
  return {
    namespace,
    componentNames: new Set(
      components.flatMap((component) => {
        const name = stringOf(recordOf(component)['name']);
        return name ? [name] : [];
      })
    ),
  };
};
