import { maxBy } from 'es-toolkit';
import { classifyGridRows } from './classify-grid-rows';
import {
  describeAttributes,
  describeLabelConflicts,
  STRUCTURAL_ROLES,
} from './classify-column-attribute';
import { detectTableHeader, TableHeader } from './detect-table-header';
import {
  countRecognizedRoles,
  FORM_MIN_ROLES,
  inferFormLayout,
  readFormFields,
} from './infer-form-layout';
import {
  ColumnRole,
  describeColumnRole,
  LabelRole,
  matchColumnLabel,
} from './match-column-label';
import {
  ColumnBlock,
  ColumnProfile,
  isNumberingColumn,
  isPiloteLikeColumn,
  isTextColumn,
  profileColumns,
  readGridValues,
  ReadValue,
  splitSegments,
} from './profile-columns';
import { Level, readHierarchyLevels } from './read-nested-levels';
import { readBannerPaths, readOutline } from './read-outline';
import {
  collapseSpaces,
  columnLetter,
  filledCellsOf,
  SheetGrid,
  sheetLabel,
} from './sheet-grid';
import {
  ColumnLayout,
  ColumnLevel,
  FicheBlock,
  LayoutCheck,
  LayoutContext,
  MIN_FICHES,
  MIN_TITLE_LENGTH,
  SheetLayout,
  summarizeChecks,
} from './sheet-layout';

const MIN_COVERED_ROWS = 0.8;
const MIN_DISTINCT_TITLES = 0.9;
/** Part des titres rédigés : un titre de fiche est une phrase, pas un nom ni un courriel. */
const MIN_WORDED_TITLES = 0.8;
const NUMERO_MIN_FILL = 0.5;
const NUMERO_MIN_RUNS = 0.9;
const ROW_TITLE_MIN_FILL = 0.5;
const ROW_TITLE_MIN_RUNS = 0.7;
const ROW_TEXT_MIN_LENGTH = 8;
const SOUS_ACTION_MIN_CHANGES = 0.8;
const SOUS_ACTION_MIN_FILL = 0.5;
const TITLE_MAX_SCORED_LENGTH = 120;

// Ce qui, en plus d'un titre, fait d'un tableau plat un plan : qui pilote,
// où en est la fiche, quand. Un montant ou une date seule ne suffisent pas
// (un budget par poste, un planning de réunions).
const PLAN_ATTRIBUTE_ROLES: ReadonlySet<ColumnRole> = new Set([
  'structurePilote',
  'servicePilote',
  'personnePilote',
  'statut',
  'calendrier',
  'dateDebut',
  'dateFin',
]);

/**
 * Le rôle de chaque colonne d'un onglet, et ses fiches, déduits du contenu :
 * blocs fusionnés ou répétés emboîtés pour la hiérarchie, colonne qui change
 * à chaque rangée pour les sous-actions, valeurs pour les attributs. Le
 * libellé ne fait que départager, et un avertissement signale quand il
 * contredit le contenu.
 */
export const inferSheetLayout = (
  grid: SheetGrid,
  context: LayoutContext = {}
): SheetLayout => inferFormLayout(grid) ?? inferTableLayout(grid, context);

const inferTableLayout = (
  grid: SheetGrid,
  context: LayoutContext
): SheetLayout => {
  const header = detectTableHeader(grid);
  const labels = header?.labels ?? [];
  const outline = readOutline(grid, classifyGridRows(grid, header));
  const rows = outline.rows;
  const valueAt = readGridValues(grid, rows);
  const profiles = profileColumns(grid, rows, labels, valueAt);
  const dataRows = splitSegments(rows).flat();
  const labelRoles = new Map(
    profiles.map((profile) => [profile.col, matchColumnLabel(profile.label)])
  );
  const roleOfLabel = (profile: ColumnProfile) =>
    labelRoles.get(profile.col) ?? null;

  const levels = readHierarchyLevels(profiles, roleOfLabel);
  const levelCols = new Set(
    levels.flatMap((level) => level.profiles.map(({ col }) => col))
  );
  const finest = levels.at(-1);
  const rowTextProfiles = profiles.filter(
    (profile) =>
      !levelCols.has(profile.col) &&
      isTextColumn(profile) &&
      !profile.isClosedList &&
      !isPiloteLikeColumn(profile) &&
      profile.averageLength >= ROW_TEXT_MIN_LENGTH
  );

  const finestTitle = finest ? pickTitle(finest.profiles, roleOfLabel) : null;
  const sousActionCandidate = finest
    ? pickSousAction(
        rowTextProfiles,
        finestTitle?.blocks ?? [],
        valueAt,
        roleOfLabel
      )
    : null;
  const ficheIsFinestLevel =
    finest !== undefined &&
    finestTitle !== null &&
    isFicheLevel(finest, finestTitle, sousActionCandidate, levels, roleOfLabel);

  const hierarchy = ficheIsFinestLevel ? levels.slice(0, -1) : levels;
  const titreProfile = ficheIsFinestLevel
    ? finestTitle
    : pickRowTitle(rowTextProfiles, roleOfLabel);
  const isNumeroColumn = (profile: ColumnProfile) =>
    isNumberingColumn(profile) &&
    profile.fillRatio >= NUMERO_MIN_FILL &&
    isNumeroLabel(roleOfLabel(profile));
  const numeroProfile = ficheIsFinestLevel
    ? finest?.profiles.find(isNumeroColumn) ?? null
    : profiles.find(
        (profile) =>
          !levelCols.has(profile.col) &&
          isNumeroColumn(profile) &&
          profile.runsRatio >= NUMERO_MIN_RUNS
      ) ?? null;
  const sousActionProfile = ficheIsFinestLevel ? sousActionCandidate : null;
  // Une numérotation plus profonde que la fiche donne ses sous-actions,
  // écrites dans la colonne des titres.
  const hasOutlineSousActions = !ficheIsFinestLevel && outline.subRows.size > 0;
  const outlineSubRows = new Set([...outline.subRows.values()].flat());

  const fiches = titreProfile
    ? readFicheBlocks({
        ficheBlocks: ficheIsFinestLevel
          ? titreProfile.blocks
          : dataRows
              .filter((row) => !outlineSubRows.has(row))
              .map((row) => ({
                rows: [row, ...(outline.subRows.get(row) ?? [])],
                value: valueAt(row, titreProfile.col),
                merged: false,
              })),
        hierarchyCols: hierarchy.map(
          (level) => pickTitle(level.profiles, roleOfLabel) ?? level.profiles[0]
        ),
        pathByRow: readBannerPaths(rows, outline.levels),
        numeroCol: numeroProfile?.col ?? null,
        valueAt,
        subRows: hasOutlineSousActions ? outline.subRows : null,
      })
    : [];

  const structural = describeStructure({
    hierarchy,
    titreProfile,
    titreReason: ficheIsFinestLevel
      ? `bloc le plus fin (${titreProfile?.blocks.length ?? 0} fiches)`
      : 'une fiche par rangée',
    numeroProfile,
    sousActionProfile,
  });
  const structuralCols = new Set(structural.map(({ col }) => col));
  const attributes = describeAttributes({
    profiles: profiles.filter((profile) => !structuralCols.has(profile.col)),
    roleOfLabel,
    fiches,
    perRow: !ficheIsFinestLevel && !hasOutlineSousActions,
    valueAt,
    listValues: context.listValues,
  });
  const columns = [...structural, ...attributes].sort((a, b) => a.col - b.col);

  const warnings = [
    ...describeLabelConflicts(
      grid.name,
      columns,
      (col) => labelRoles.get(col) ?? null
    ),
    ...describeUnknownColumns(grid.name, columns),
    ...describeFichesWithoutAxis(grid.name, fiches),
  ];

  const hasBanners = rows.some(({ kind }) => kind === 'banner');
  const titleTexts = rows
    .filter(({ kind }) => kind === 'title')
    .map(({ row }) => rowText(grid, row))
    .filter((text) => text !== '');

  return {
    sheet: grid.name,
    shape: outline.isOutline
      ? 'numerotation'
      : hierarchy.length > 0
      ? 'horizontale'
      : hasBanners
      ? 'verticale'
      : 'plate',
    header,
    titleTexts,
    columns,
    fiches,
    sousActionCol:
      sousActionProfile?.col ??
      (hasOutlineSousActions ? titreProfile?.col ?? null : null),
    form: null,
    valueAt,
    uncoveredRows:
      dataRows.length -
      fiches.reduce(
        (total, { rows: ficheRows }) => total + ficheRows.length,
        0
      ),
    ...summarizeChecks(
      checkTableLayout({
        grid,
        fiches,
        dataRows,
        header,
        titreLabel: titreProfile ? roleOfLabel(titreProfile) : null,
        hasStructure:
          hierarchy.length >= 2 ||
          hasBanners ||
          sousActionProfile !== null ||
          hasOutlineSousActions,
        hierarchyDepth: hierarchy.length,
        attributes: columns,
      })
    ),
    warnings,
  };
};

const describeStructure = ({
  hierarchy,
  titreProfile,
  titreReason,
  numeroProfile,
  sousActionProfile,
}: {
  hierarchy: Level[];
  titreProfile: ColumnProfile | null;
  titreReason: string;
  numeroProfile: ColumnProfile | null;
  sousActionProfile: ColumnProfile | null;
}): ColumnLayout[] => {
  const describe = (
    profile: ColumnProfile,
    role: ColumnRole,
    level: ColumnLevel,
    reason: string
  ): ColumnLayout => ({
    col: profile.col,
    letter: columnLetter(profile.col),
    label: profile.label,
    role,
    level,
    reason,
  });
  // Une seule colonne de numéros peut être à la fois le bloc et le n° : le
  // dernier rôle l'emporte.
  const layouts = [
    ...hierarchy.flatMap((level, index) =>
      level.profiles.map((profile) =>
        describe(
          profile,
          'hierarchie',
          'axe',
          `niveau ${index + 1} : ${level.starts.size} blocs ${
            profile.hasVerticalMerges ? 'fusionnés' : 'répétés'
          }`
        )
      )
    ),
    ...(titreProfile
      ? [describe(titreProfile, 'titre', 'fiche', titreReason)]
      : []),
    ...(numeroProfile
      ? [describe(numeroProfile, 'numero', 'fiche', 'numéros de fiche')]
      : []),
    ...(sousActionProfile
      ? [
          describe(
            sousActionProfile,
            'sousAction',
            'row',
            'change à chaque rangée sous la fiche'
          ),
        ]
      : []),
  ];
  return [...new Map(layouts.map((layout) => [layout.col, layout])).values()];
};

/** Un montant numéroté 1, 2, 3 reste un montant : le libellé départage. */
const isNumeroLabel = (role: LabelRole | null): boolean =>
  role === null ||
  role === 'numero' ||
  role === 'titre' ||
  role === 'hierarchie';

/** Le libellé d'un niveau ou d'une fiche : texte long, varié, pas un pilote. */
const pickTitle = (
  profiles: ColumnProfile[],
  roleOfLabel: (profile: ColumnProfile) => LabelRole | null
): ColumnProfile | null => {
  const texts = profiles.filter(
    (profile) => isTextColumn(profile) && !isNumberingColumn(profile)
  );
  const candidates = texts.length > 0 ? texts : profiles;
  return (
    maxBy(candidates, (profile) => {
      const role = roleOfLabel(profile);
      return (
        profile.distinctRatio *
        Math.min(profile.averageLength, TITLE_MAX_SCORED_LENGTH) *
        (role === 'titre' ? 1.5 : 1) *
        (isPiloteLikeColumn(profile) ? 0.2 : 1) *
        (isNumberingColumn(profile) ? 0.1 : 1)
      );
    }) ?? null
  );
};

const pickRowTitle = (
  profiles: ColumnProfile[],
  roleOfLabel: (profile: ColumnProfile) => LabelRole | null
): ColumnProfile | null =>
  pickTitle(
    profiles.filter(
      (profile) =>
        profile.fillRatio >= ROW_TITLE_MIN_FILL &&
        profile.runsRatio >= ROW_TITLE_MIN_RUNS
    ),
    roleOfLabel
  );

/** La colonne qui change à chaque rangée d'une même fiche. */
const pickSousAction = (
  profiles: ColumnProfile[],
  ficheBlocks: ColumnBlock[],
  valueAt: ReadValue,
  roleOfLabel: (profile: ColumnProfile) => LabelRole | null
): ColumnProfile | null => {
  const multiRow = ficheBlocks.filter(({ rows }) => rows.length > 1);
  if (multiRow.length === 0) {
    return null;
  }
  const candidates = profiles.filter((profile) => {
    let rowCount = 0;
    let filled = 0;
    let changes = 0;
    for (const { rows } of multiRow) {
      let previous = '';
      for (const row of rows) {
        const value = valueAt(row, profile.col);
        rowCount += 1;
        if (value !== '') {
          filled += 1;
          if (value !== previous) {
            changes += 1;
          }
        }
        previous = value;
      }
    }
    return (
      filled / rowCount >= SOUS_ACTION_MIN_FILL &&
      changes / filled >= SOUS_ACTION_MIN_CHANGES
    );
  });
  return (
    maxBy(
      candidates,
      (profile) =>
        profile.averageLength * (roleOfLabel(profile) === 'sousAction' ? 2 : 1)
    ) ?? null
  );
};

/**
 * Le niveau le plus fin est la fiche quand il porte un n°, quand les libellés
 * le disent (« Titre de l'action » au-dessus, « Sous-action » en dessous), ou
 * sous au moins un autre niveau. Un seul niveau nommé « Axe » au-dessus
 * d'une colonne par rangée est un tableau plat : une rangée, une fiche.
 */
const isFicheLevel = (
  finest: Level,
  title: ColumnProfile,
  sousAction: ColumnProfile | null,
  levels: Level[],
  roleOfLabel: (profile: ColumnProfile) => LabelRole | null
): boolean => {
  if (finest.profiles.some(isNumberingColumn)) {
    return true;
  }
  const titleRole = roleOfLabel(title);
  const sousActionRole = sousAction ? roleOfLabel(sousAction) : null;
  if (titleRole === 'titre' || sousActionRole === 'sousAction') {
    return true;
  }
  if (titleRole === 'hierarchie' || sousActionRole === 'titre') {
    return false;
  }
  return sousAction !== null && levels.length >= 2;
};

const readFicheBlocks = ({
  ficheBlocks,
  hierarchyCols,
  pathByRow,
  numeroCol,
  valueAt,
  subRows,
}: {
  ficheBlocks: ColumnBlock[];
  hierarchyCols: ColumnProfile[];
  pathByRow: Map<number, string[]>;
  numeroCol: number | null;
  valueAt: ReadValue;
  subRows: Map<number, number[]> | null;
}): FicheBlock[] =>
  ficheBlocks
    .filter(({ value }) => value.trim() !== '')
    .map(({ rows, value }) => {
      const [first] = rows;
      const numero = numeroCol === null ? '' : valueAt(first, numeroCol);
      return {
        rows,
        ...(subRows ? { sousActionRows: subRows.get(first) ?? [] } : {}),
        path: [
          ...(pathByRow.get(first) ?? []),
          ...hierarchyCols
            .map(({ col }) => collapseSpaces(valueAt(first, col)))
            .filter((segment) => segment !== ''),
        ],
        titre: collapseSpaces(value),
        numero: numero === '' ? null : numero,
      };
    });

const checkTableLayout = ({
  grid,
  fiches,
  dataRows,
  header,
  titreLabel,
  hasStructure,
  hierarchyDepth,
  attributes,
}: {
  grid: SheetGrid;
  fiches: FicheBlock[];
  dataRows: number[];
  header: TableHeader | null;
  titreLabel: LabelRole | null;
  hasStructure: boolean;
  hierarchyDepth: number;
  attributes: ColumnLayout[];
}): LayoutCheck[] => {
  const coveredRows = fiches.reduce(
    (total, { rows }) => total + rows.length,
    0
  );
  const averageTitle =
    fiches.reduce((total, { titre }) => total + titre.length, 0) /
    Math.max(1, fiches.length);
  const distinctTitles = new Set(
    fiches.map(({ path, titre, numero }) =>
      JSON.stringify([...path, numero, titre])
    )
  ).size;
  const wordedTitles = fiches.filter(({ titre }) => isWorded(titre)).length;
  const planAttributes = attributes.filter(({ role }) =>
    PLAN_ATTRIBUTE_ROLES.has(role)
  ).length;
  const formFields = header
    ? countRecognizedRoles(readFormFields(grid, header.titleRows).fields)
    : 0;
  const checks: LayoutCheck[] = [
    [
      fiches.length >= MIN_FICHES,
      `${fiches.length} fiches (au moins ${MIN_FICHES})`,
    ],
    [
      dataRows.length > 0 && coveredRows / dataRows.length >= MIN_COVERED_ROWS,
      `${coveredRows}/${dataRows.length} rangées rattachées à une fiche`,
    ],
    [
      averageTitle >= MIN_TITLE_LENGTH,
      `titres de ${Math.round(averageTitle)} caractères en moyenne`,
    ],
    [
      fiches.length > 0 &&
        distinctTitles / fiches.length >= MIN_DISTINCT_TITLES,
      `${distinctTitles} fiches distinctes`,
    ],
    [
      fiches.length > 0 && wordedTitles / fiches.length >= MIN_WORDED_TITLES,
      `${wordedTitles}/${fiches.length} titres rédigés`,
    ],
    hasStructure
      ? [true, 'hiérarchie, bandeaux ou sous-actions']
      : [
          header !== null && titreLabel === 'titre' && planAttributes > 0,
          `tableau ${
            hierarchyDepth > 0 ? 'à un niveau' : 'plat'
          } : libellé de titre${
            titreLabel === 'titre' ? '' : ' non reconnu'
          }, ${planAttributes} colonne(s) de pilote, statut ou dates`,
        ],
  ];
  if (titreLabel !== null && !STRUCTURAL_ROLES.has(titreLabel)) {
    checks.push([
      false,
      `le libellé des titres annonce ${describeColumnRole(titreLabel)}`,
    ]);
  }
  // Une fiche-action et le tableau de ses étapes : le code lirait les
  // étapes pour des fiches et perdrait le formulaire.
  if (formFields >= FORM_MIN_ROLES) {
    checks.push([
      false,
      `formulaire de fiche (${formFields} champs) au-dessus du tableau`,
    ]);
  }
  return checks;
};

/** Plusieurs mots, et pas un courriel ni un lien. */
const isWorded = (titre: string): boolean =>
  /\S\s+\S/.test(titre) && !/@|https?:\/\//i.test(titre);

const describeUnknownColumns = (
  sheet: string,
  columns: ColumnLayout[]
): string[] => {
  const unknown = columns.filter(({ role }) => role === 'autre');
  return unknown.length === 0
    ? []
    : [
        `${sheetLabel(
          sheet
        )} : colonnes non reconnues, reprises dans la description des fiches : ${unknown
          .map(({ letter, label }) =>
            label ? `${letter} « ${label} »` : letter
          )
          .join(', ')}.`,
      ];
};

/**
 * Une fiche sans axe parmi des fiches rangées : un regroupement mal lu (une
 * valeur écrite une fois sous une colonne fusionnée), à vérifier.
 */
const describeFichesWithoutAxis = (
  sheet: string,
  fiches: FicheBlock[]
): string[] => {
  const orphans = fiches.filter(({ path }) => path.length === 0);
  return orphans.length === 0 || orphans.length === fiches.length
    ? []
    : [
        `${sheetLabel(sheet)} : ${
          orphans.length
        } fiche(s) sans axe parmi des fiches rangées sous un axe, à vérifier : ${orphans
          .map(({ titre, rows }) => `« ${titre} » (ligne ${rows[0]})`)
          .join(', ')}.`,
      ];
};

const rowText = (grid: SheetGrid, row: number): string =>
  collapseSpaces(
    filledCellsOf(grid, row)
      .map(({ text }) => text)
      .join(' ')
  );
