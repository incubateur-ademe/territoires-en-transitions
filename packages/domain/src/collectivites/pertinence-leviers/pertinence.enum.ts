export const pertinenceEnumValues = [
  'non_pertinent',
  'a_discuter',
  'pertinent',
] as const;

export type Pertinence = (typeof pertinenceEnumValues)[number];
