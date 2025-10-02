import { z } from 'zod';
import { indicateurDefinitionSchema } from '../shared/models/indicateur-definition.table';

export const importIndicateurDefinitionSchema = indicateurDefinitionSchema
  .omit({
    modifiedAt: true,
    modifiedBy: true,
    createdAt: true,
    createdBy: true,
    id: true,
    groupementId: true,
    collectiviteId: true,
  })
  .extend({
    identifiantReferentiel: z.string(), // Mandatory in this case
    parents: z
      .union([
        z
          .string()
          .transform((value) =>
            typeof value === 'string'
              ? value.split(',').map((val) => val.trim())
              : value
          )
          .pipe(z.string().array()),
        z.string().array(),
      ])
      .nullable()
      .optional(),
    categories: z
      .union([
        z
          .string()
          .transform((value) =>
            typeof value === 'string'
              ? value.split(',').map((val) => val.trim())
              : value
          )
          .pipe(z.string().array()),
        z.string().array(),
      ])
      .nullable()
      .optional(),
    thematiques: z
      .union([
        z
          .string()
          .transform((value) =>
            typeof value === 'string'
              ? value.split(',').map((val) => val.trim())
              : value
          )
          .pipe(z.string().array()),
        z.string().array(),
      ])
      .nullable()
      .optional(),
  });

export type ImportIndicateurDefinitionType = z.infer<
  typeof importIndicateurDefinitionSchema
>;
