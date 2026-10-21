import { isAxisHeading } from './classify-grid-rows';
import { TableHeader } from './detect-table-header';
import { ColumnRole } from './match-column-label';
import { ReadValue } from './profile-columns';

export type SheetShape =
  | 'horizontale'
  | 'verticale'
  | 'numerotation'
  | 'plate'
  | 'formulaire';

/** À quel niveau une colonne se lit : axe, fiche entière, ou une rangée. */
export type ColumnLevel = 'axe' | 'fiche' | 'row';

export type ColumnLayout = {
  col: number;
  letter: string;
  label: string;
  role: ColumnRole;
  level: ColumnLevel;
  /** L'année d'une colonne de calendrier à croix. */
  year?: number;
  /** Un montant de plus que le budget : ses valeurs vont aux financements, libellées. */
  isSecondaryAmount?: boolean;
  reason: string;
};

export type FicheBlock = {
  /** Les rangées de la fiche, dans l'ordre. */
  rows: number[];
  /**
   * Les rangées de ses sous-actions, quand elles ne se lisent pas à la
   * colonne des sous-actions (numérotation plus profonde que la fiche).
   */
  sousActionRows?: number[];
  /** Bandeaux, puis colonnes de hiérarchie, du plus large au plus fin. */
  path: string[];
  titre: string;
  numero: string | null;
};

/** Un champ d'une fiche-formulaire : libellé, puis ses valeurs. */
export type FormField = { label: string; role: ColumnRole; values: string[] };

export type SheetLayout = {
  sheet: string;
  shape: SheetShape;
  header: TableHeader | null;
  /** Textes au-dessus du tableau : titre, bandeau d'axe d'un onglet. */
  titleTexts: string[];
  columns: ColumnLayout[];
  fiches: FicheBlock[];
  sousActionCol: number | null;
  form: FormField[] | null;
  valueAt: ReadValue;
  /** Rangées de données qui n'appartiennent à aucune fiche. */
  uncoveredRows: number;
  /** Part des contrôles réussis. */
  confidence: number;
  /** Tous les contrôles réussis : l'onglet peut être lu sans le modèle. */
  confident: boolean;
  reasons: string[];
  warnings: string[];
};

export type LayoutContext = {
  /** Valeurs des onglets de listes : une colonne qui s'y tient est un statut. */
  listValues?: ReadonlySet<string>;
};

export type LayoutCheck = [ok: boolean, reason: string];

export const MIN_FICHES = 3;
export const MIN_TITLE_LENGTH = 20;

/** La confiance d'un onglet : part des contrôles réussis, et leur détail. */
export const summarizeChecks = (
  checks: LayoutCheck[]
): Pick<SheetLayout, 'confidence' | 'confident' | 'reasons'> => {
  const passed = checks.filter(([ok]) => ok).length;
  return {
    confidence: passed / checks.length,
    confident: passed === checks.length,
    reasons: checks.map(([ok, reason]) => `${ok ? '✓' : '✗'} ${reason}`),
  };
};

export const columnsOf = (
  layout: SheetLayout,
  role: ColumnRole
): ColumnLayout[] => layout.columns.filter((column) => column.role === role);

/** Les rangées des sous-actions d'une fiche ; les autres sont les siennes. */
export const sousActionRowsOf = (
  layout: SheetLayout,
  fiche: FicheBlock
): number[] => {
  if (fiche.sousActionRows) {
    return fiche.sousActionRows;
  }
  const { sousActionCol, valueAt } = layout;
  return sousActionCol === null
    ? []
    : fiche.rows.filter((row) => valueAt(row, sousActionCol) !== '');
};

/** Un texte d'onglet qui nomme un axe : « Axe 1 – Mobilité ». */
export const findAxisTitle = (layout: SheetLayout): string | null =>
  layout.titleTexts.find(isAxisHeading) ?? null;
