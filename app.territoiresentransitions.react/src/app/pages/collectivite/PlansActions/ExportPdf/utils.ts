export type PdfSectionKey =
  | 'intro'
  | 'planning'
  | 'acteurs'
  | 'indicateurs'
  | 'etapes'
  | 'suivi'
  | 'budget'
  | 'fiches'
  | 'actions'
  | 'notes';

export const keyToTitle: Record<PdfSectionKey, string> = {
  intro:
    'Intro : Description, Moyens humains et techniques, Instances de gouvernance',
  planning: 'Planning',
  acteurs: 'Acteurs',
  indicateurs: 'Indicateurs de suivi',
  etapes: 'Étapes',
  suivi: 'Notes de suivi',
  budget: 'Budget',
  fiches: 'Fiches des plans liés',
  actions: 'Actions des référentiels liés',
  notes: 'Notes et documents',
};

export type TSectionsValues = { [key: string]: { isChecked: boolean } };

export const sectionsInitValue: TSectionsValues = Object.keys(
  keyToTitle
).reduce(
  (newObj, currKey) => ({ ...newObj, [currKey]: { isChecked: true } }),
  {}
);

export type TSectionsList = { key: PdfSectionKey; title: string }[];

export const sectionsList: TSectionsList = Object.keys(keyToTitle).map(
  (key) => ({
    key: key as PdfSectionKey,
    title: keyToTitle[key as PdfSectionKey],
  })
);
