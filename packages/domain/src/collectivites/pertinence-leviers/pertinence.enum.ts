export const pertinenceEnumValues = ['non_pertinent', 'pertinent'] as const;

export type Pertinence = (typeof pertinenceEnumValues)[number];
