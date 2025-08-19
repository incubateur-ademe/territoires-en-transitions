import z from 'zod';

export const listCollectivitesFieldsMode = ['resume', 'public'] as const;

export const listCollectivitesFieldsModeSchema = z.enum(
  listCollectivitesFieldsMode
);

export type ListCollectivitesFieldsMode =
  (typeof listCollectivitesFieldsMode)[number];
