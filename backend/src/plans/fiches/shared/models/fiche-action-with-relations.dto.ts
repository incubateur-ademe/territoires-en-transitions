import { collectiviteSchema } from '@/backend/collectivites/index-domain';
import z from 'zod';
import { ficheSchema } from './fiche-action.table';

export const ficheActionWithRelationsSchema = ficheSchema.extend({
  partenaires: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .nullable()
    .describe('Partenaires'),
  pilotes: z
    .object({
      tagId: z.number().nullable(),
      userId: z.string().nullable(),
      nom: z.string().nullable(),
      prenom: z.string().optional().nullable(),
      email: z.string().optional().nullable(),
      telephone: z.string().optional().nullable(),
    })
    .array()
    .nullable()
    .describe('Personnes pilote'),
  referents: z
    .object({
      tagId: z.number().nullable(),
      userId: z.string().nullable(),
      nom: z.string().nullable(),
      prenom: z.string().optional().nullable(),
      email: z.string().optional().nullable(),
      telephone: z.string().optional().nullable(),
    })
    .array()
    .nullable()
    .describe('Élu·e référent·e'),
  tags: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .nullable()
    .describe('Tags personnalisés'),
  financeurs: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .nullable()
    .describe('Financeurs'),
  sousThematiques: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .nullable()
    .describe('Sous-thématiques'),
  thematiques: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .nullable()
    .describe('Thématiques'),
  structures: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .nullable()
    .describe('Structure pilote'),
  indicateurs: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .nullable()
    .describe('Indicateurs associés'),
  services: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .nullable()
    .describe('Directions ou services pilote'),
  effetsAttendus: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .nullable()
    .describe('Effets attendus'),
  axes: z
    .object({
      id: z.number(),
      nom: z.string(),
      parentId: z.number().nullable(),
      parentNom: z.string().nullable(),
    })
    .array()
    .nullable()
    .describe('Axes'),
  plans: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .nullable()
    .describe("Plans d'action"),
});

export type FicheActionWithRelationsType = z.infer<
  typeof ficheActionWithRelationsSchema
>;

export const ficheActionWithRelationsAndCollectiviteSchema =
  ficheActionWithRelationsSchema.extend({
    collectivite: collectiviteSchema
      .optional()
      .describe('Collectivité à laquelle la fiche est rattachée'),
  });
export type FicheActionWithRelationsAndCollectiviteType = z.infer<
  typeof ficheActionWithRelationsAndCollectiviteSchema
>;
