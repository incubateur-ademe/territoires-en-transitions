/** Un passage d'un libellé : `[début, fin[`. */
export type TextRange = readonly [start: number, end: number];

export type SearchComboboxOption = {
  /**
   * Unique dans son groupe : `onSelectOption` reçoit l'option et son groupe,
   * qui dit à quoi l'identifiant se rapporte.
   */
  id: string;
  label: string;
  /** Les passages du libellé qui répondent à la saisie, mis en gras. */
  highlightRanges?: readonly TextRange[];
  /** Une ligne de contexte sous le libellé. */
  description?: string;
  /** Une étiquette courte accolée au libellé. */
  badge?: string;
  /** Une information alignée à droite, un décompte par exemple. */
  meta?: string;
  /** Reconnue à quelques fautes de frappe près : l'option le signale. */
  isApproximate?: boolean;
};

export type SearchComboboxGroup = {
  id: string;
  label: string;
  options: SearchComboboxOption[];
  /** Le nombre de correspondances, quand `options` n'en montre qu'une partie. */
  totalCount?: number;
};

/** Ce que l'utilisateur a déjà choisi, affiché en étiquette dans le champ. */
export type SearchComboboxSelection = {
  id: string;
  label: string;
};
