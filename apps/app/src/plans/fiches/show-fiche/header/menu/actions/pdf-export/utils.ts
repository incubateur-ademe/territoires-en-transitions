import { RouterInput } from '@tet/api';

type GeneratePdfInput = RouterInput['plans']['fiches']['generatePdf'];
export type PdfSectionKey = NonNullable<GeneratePdfInput['sections']>[number];

export const ALL_YEARS_OPTION_KEY = 'all' as const;

export type NotesYearsSelection = Array<number | typeof ALL_YEARS_OPTION_KEY>;

export type TSectionsValues = Record<
  PdfSectionKey,
  { isChecked: boolean; values: NotesYearsSelection | undefined }
>;

export const sectionsInitValue: TSectionsValues = {
  intro: { isChecked: true, values: undefined },
  acteurs: { isChecked: true, values: undefined },
  indicateurs: { isChecked: true, values: undefined },
  notes: { isChecked: true, values: [ALL_YEARS_OPTION_KEY] },
  moyens: { isChecked: true, values: undefined },
  fiches: { isChecked: true, values: undefined },
  actionsLiees: { isChecked: true, values: undefined },
  documents: { isChecked: true, values: undefined },
};

export type TSectionsList = { key: PdfSectionKey; title: string }[];

export const sectionsList: TSectionsList = [
  { key: 'intro', title: 'Intro : Description, Instances de gouvernance' },
  { key: 'acteurs', title: 'Acteurs du projet' },
  { key: 'indicateurs', title: 'Indicateurs liés' },
  { key: 'notes', title: 'Notes' },
  { key: 'moyens', title: 'Budget' },
  { key: 'fiches', title: 'Actions liées' },
  { key: 'actionsLiees', title: 'Mesures des référentiels liées' },
  { key: 'documents', title: 'Documents' },
];

function toNotesYearsFilter(
  selectedYears: NotesYearsSelection | undefined
): number[] | 'all' {
  if (!selectedYears || selectedYears.length === 0) return 'all';
  if (selectedYears.includes(ALL_YEARS_OPTION_KEY)) return 'all';
  return selectedYears.filter((v): v is number => v !== ALL_YEARS_OPTION_KEY);
}

export function sectionsValuesToApiInput(sections: TSectionsValues): {
  sections: PdfSectionKey[];
  notesYears: number[] | 'all';
} {
  const enabledSections = sectionsList
    .filter(({ key }) => sections[key].isChecked)
    .map(({ key }) => key);

  return {
    sections: enabledSections,
    notesYears: toNotesYearsFilter(sections.notes.values),
  };
}
