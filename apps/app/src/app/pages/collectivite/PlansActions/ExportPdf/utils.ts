export type PdfSectionKey =
  | 'intro'
  | 'planning'
  | 'acteurs'
  | 'indicateurs'
  | 'etapes'
  | 'notes_suivi'
  | 'moyens'
  | 'fiches'
  | 'actionsLiees'
  | 'notes_docs';

export const keyToTitle: Record<PdfSectionKey, string> = {
  intro: 'Intro : Description, Instances de gouvernance',
  planning: 'Calendrier',
  acteurs: 'Acteurs',
  indicateurs: 'Indicateurs de suivi',
  etapes: 'Étapes',
  notes_suivi: 'Notes de suivi',
  moyens: 'Moyens',
  fiches: 'Fiches action liées',
  actionsLiees: 'Mesures des référentiels liées',
  notes_docs: 'Notes et documents',
};

export type TSectionsValues = Record<
  PdfSectionKey,
  { isChecked: boolean; values: number[] | undefined }
>;

export const sectionsInitValue: TSectionsValues = {
  intro: { isChecked: true, values: undefined },
  planning: { isChecked: true, values: undefined },
  acteurs: { isChecked: true, values: undefined },
  indicateurs: { isChecked: true, values: undefined },
  etapes: { isChecked: true, values: undefined },
  notes_suivi: { isChecked: true, values: [0] },
  moyens: { isChecked: true, values: undefined },
  fiches: { isChecked: true, values: undefined },
  actionsLiees: { isChecked: true, values: undefined },
  notes_docs: { isChecked: true, values: undefined },
};

export type TSectionsList = { key: PdfSectionKey; title: string }[];

export const sectionsList: TSectionsList = Object.keys(keyToTitle).map(
  (key) => ({
    key: key as PdfSectionKey,
    title: keyToTitle[key as PdfSectionKey],
  })
);
