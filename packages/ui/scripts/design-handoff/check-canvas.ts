import { NAMESPACE } from '../design-system-export/components.ts';
import {
  emptyCanvasIndex,
  parseBundleHeader,
  parseCanvasIndex,
  proposalsOf,
  type BundleHeader,
} from './canvas-index.ts';
import { describeComposition } from './describe-composition.ts';
import { lintBoard, type Violation } from './lint-board.ts';

export type CanvasFiles = Readonly<Record<string, string>>;

export type CanvasCheck = Readonly<{
  designSystem: Readonly<{
    isInstalled: boolean;
    isCopyOutdated: boolean | undefined;
  }>;
  violations: ReadonlyArray<Violation>;
  proposals: ReadonlyArray<string>;
  composition: string;
}>;

const PROJECT_PREFIX = 'project/';
const CANVAS_INDEX_PATH = `${PROJECT_PREFIX}canvas.json`;
const BUNDLE_PATH = /^project\/ds\/([^/]+)\/components\/bundle\.js$/;

const isBoardPath = (path: string): boolean =>
  path.endsWith('.dc.html') && !path.startsWith(`${PROJECT_PREFIX}ds/`);

type InstalledDesignSystem = Readonly<{
  folder: string;
  header: BundleHeader;
}>;

const findInstalledDesignSystem = (
  files: CanvasFiles
): InstalledDesignSystem | undefined =>
  Object.entries(files).flatMap(([path, source]) => {
    const folder = BUNDLE_PATH.exec(path)?.[1];
    const header = folder ? parseBundleHeader(source) : undefined;
    return folder && header?.namespace === NAMESPACE
      ? [{ folder, header }]
      : [];
  })[0];

const boardTitleOf = (
  path: string,
  boardTitles: Readonly<Record<string, string>>
): string => {
  const boardKey = path.slice(PROJECT_PREFIX.length);
  return boardTitles[boardKey] ?? boardKey;
};

export const checkCanvas = ({
  files,
  currentDesignSystemVersion,
}: Readonly<{
  files: CanvasFiles;
  currentDesignSystemVersion: string | undefined;
}>): CanvasCheck => {
  const indexSource = files[CANVAS_INDEX_PATH];
  const index = indexSource ? parseCanvasIndex(indexSource) : emptyCanvasIndex;
  const installed = findInstalledDesignSystem(files);
  const copyVersion = index.designSystems.find(
    ({ namespace }) => namespace === installed?.folder
  )?.version;
  const boardPaths = Object.keys(files).filter(isBoardPath).sort();

  const missingDesignSystem: ReadonlyArray<Violation> = installed
    ? []
    : [
        {
          rule: 'R1',
          board: 'canevas',
          where: 'design system',
          message:
            "le design system Territoires en Transitions n'est pas installé dans le canevas",
        },
      ];

  const boardChecks = boardPaths.map((path) => {
    const board = boardTitleOf(path, index.boardTitles);
    const html = files[path] ?? '';
    return {
      violations: lintBoard({ board, html, designSystem: installed?.header }),
      composition: `### ${board}\n\n${describeComposition(html) || '(vide)'}`,
    };
  });

  return {
    designSystem: {
      isInstalled: installed !== undefined,
      isCopyOutdated:
        copyVersion === undefined || currentDesignSystemVersion === undefined
          ? undefined
          : copyVersion !== currentDesignSystemVersion,
    },
    violations: [
      ...missingDesignSystem,
      ...boardChecks.flatMap(({ violations }) => violations),
    ],
    proposals: proposalsOf(index.noteTexts),
    composition: boardChecks.map(({ composition }) => composition).join('\n\n'),
  };
};
