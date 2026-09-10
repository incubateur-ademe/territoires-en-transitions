export const enjeuEnumValues = ['ges'] as const;

export type Enjeu = (typeof enjeuEnumValues)[number];
