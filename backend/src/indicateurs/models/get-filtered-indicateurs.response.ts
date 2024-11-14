import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

extendZodWithOpenApi(z);

export const getFilteredIndicateurResponseSchema = extendApi(
  z.object({
    id: z.number(),
    titre: z.string(),
    estPerso: z.boolean(),
    identifiant: z.string().nullable(),
    hasOpenData: z.boolean(),
  })
);

export type GetFilteredIndicateurResponseType = z.infer<
  typeof getFilteredIndicateurResponseSchema
>;

export const getFilteredIndicateursResponseSchema = extendApi(
  z.object({
    indicateurs: extendApi(z.array(getFilteredIndicateurResponseSchema)),
  })
);


export class GetFilteredIndicateursResponseClass extends createZodDto(
  getFilteredIndicateursResponseSchema
) {}
