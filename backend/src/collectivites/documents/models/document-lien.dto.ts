import { z } from 'zod';

export type lienType = {
  label: string;
  url: string;
};

export const lienSchema = z
  .object({
    label: z.string().describe(`Nom descriptif du lien`),
    url: z.string().describe(`URL du lien`),
  })
  .describe('Un lien URL.');
