export const listCollectivitesFieldsMode = ['resume', 'public'] as const;

export type ListCollectivitesFieldsMode =
  (typeof listCollectivitesFieldsMode)[number];
