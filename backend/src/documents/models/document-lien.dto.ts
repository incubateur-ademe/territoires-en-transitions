import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export type lienType = {
  label: string;
  url: string;
};

export const lienSchema = extendApi(
  z
    .object({
      label: z.string().openapi({ description: `Nom descriptif du lien` }),
      url: z.string().openapi({ description: `URL du lien` }),
    })
    .openapi({
      title: 'Un lien URL.',
    }),
);