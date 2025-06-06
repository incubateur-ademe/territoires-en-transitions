export type PdfSectionKey =
  | 'intro'
  | 'planning'
  | 'acteurs'
  | 'indicateurs'
  | 'etapes'
  | 'notes_suivi'
  | 'budget'
  | 'fiches'
  | 'actionsLiees'
  | 'notes_docs';

export const keyToTitle: Record<PdfSectionKey, string> = {
  intro:
    'Intro : Description, Moyens humains et techniques, Instances de gouvernance',
  planning: 'Calendrier',
  acteurs: 'Acteurs',
  indicateurs: 'Indicateurs de suivi',
  etapes: 'Étapes',
  notes_suivi: 'Notes de suivi',
  budget: 'Budget',
  fiches: 'Fiches action liées',
  actionsLiees: 'Mesures des référentiels liées',
  notes_docs: 'Notes et documents',
};

export type TSectionsValues = {
  [key: string]: { isChecked: boolean; values: number[] | undefined };
};

export const sectionsInitValue: TSectionsValues = Object.keys(
  keyToTitle
).reduce(
  (newObj, currKey) => ({
    ...newObj,
    [currKey]: {
      isChecked: true,
      values: currKey === 'notes_suivi' ? [0] : undefined,
    },
  }),
  {}
);

export type TSectionsList = { key: PdfSectionKey; title: string }[];

export const sectionsList: TSectionsList = Object.keys(keyToTitle).map(
  (key) => ({
    key: key as PdfSectionKey,
    title: keyToTitle[key as PdfSectionKey],
  })
);
