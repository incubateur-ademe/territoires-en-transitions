import { collectiviteSchema } from '@/backend/collectivites/shared/models/collectivite.table';
import { idNameSchema } from '@/backend/collectivites/shared/models/id-name.schema';
import { personneTagOrUserSchemaWithContacts } from '@/backend/collectivites/shared/models/personne-tag-or-user.dto';
import {
  tagSchema,
  tagWithCollectiviteIdSchema,
} from '@/backend/collectivites/tags/tag.table-base';
import { effetAttenduSchema } from '@/backend/shared/effet-attendu/effet-attendu.table';
import { tempsDeMiseEnOeuvreSchema } from '@/backend/shared/models/temps-de-mise-en-oeuvre.table';
import { sousThematiqueSchema } from '@/backend/shared/thematiques/sous-thematique.table';
import { thematiqueSchema } from '@/backend/shared/thematiques/thematique.table';
import z from 'zod';
import { financeurSchema } from '../shared/models/fiche-action-financeur-tag.table';
import { ficheSchema } from '../shared/models/fiche-action.table';

export const userSchema = z.object({
  id: z.string().uuid(),
  prenom: z.string(),
  nom: z.string(),
});

export const completionSchema = z.object({
  ficheId: z.number(),
  fields: z.array(
    z.object({
      field: z.enum(['titre', 'description', 'statut', 'pilotes']),
      isCompleted: z.boolean(),
    })
  ),
  isCompleted: z.boolean(),
});

export const ficheWithRelationsSchema = ficheSchema.extend({
  collectiviteNom: z.string().nullable(),
  createdBy: userSchema.nullish(),
  modifiedBy: userSchema.nullish(),
  tempsDeMiseEnOeuvre: tempsDeMiseEnOeuvreSchema.nullish(),
  partenaires: idNameSchema.array().nullable().describe('Partenaires'),
  pilotes: z
    .array(personneTagOrUserSchemaWithContacts)
    .nullable()
    .describe('Personnes pilote'),
  referents: z
    .array(personneTagOrUserSchemaWithContacts)
    .nullable()
    .describe('Élu·e référent·e'),
  libreTags: z.array(tagSchema).nullable().describe('Tags personnalisés'),
  financeurs: financeurSchema.array().nullable().describe('Financeurs'),
  sousThematiques: sousThematiqueSchema
    .array()
    .nullable()
    .describe('Sous-thématiques'),
  thematiques: thematiqueSchema.array().nullable().describe('Thématiques'),
  structures: z.array(tagSchema).nullable().describe('Structure pilote'),
  sharedWithCollectivites: idNameSchema
    .array()
    .nullable()
    .describe('Collectivités avec lesquelles la fiche est partagée'),
  indicateurs: z
    .object({
      id: z.number(),
      nom: z.string(),
      unite: z.string(),
    })
    .array()
    .nullable()
    .describe('Indicateurs associés'),
  services: z
    .array(tagWithCollectiviteIdSchema)
    .nullable()
    .describe('Directions ou services pilote'),
  effetsAttendus: z
    .array(effetAttenduSchema)
    .nullable()
    .describe('Effets attendus'),
  axes: z
    .object({
      id: z.number(),
      nom: z.string(),
      collectiviteId: z.number(),
      parentId: z.number().nullable(),
      planId: z.number().nullable(),
    })
    .array()
    .nullable()
    .describe('Axes'),
  plans: z
    .array(tagWithCollectiviteIdSchema)
    .nullable()
    .describe("Plans d'action"),
  etapes: z
    .object({
      nom: z.string(),
      realise: z.boolean(),
      ordre: z.number(),
    })
    .array()
    .nullable()
    .describe('Etapes'),
  notes: z
    .object({
      note: z.string(),
      dateNote: z.string(),
    })
    .array()
    .nullable()
    .describe('Notes de suivi et points de vigilance'),
  mesures: z
    .object({
      id: z.string(),
      identifiant: z.string(),
      nom: z.string(),
      referentiel: z.string(),
    })
    .array()
    .nullable()
    .describe('Mesures des référentiels'),
  fichesLiees: z.array(tagSchema).nullable().describe('Fiches action'),
  docs: z
    .object({
      id: z.number(),
      filename: z.string().optional(),
      url: z.string().optional(),
    })
    .array()
    .nullable()
    .describe('Documents liés'),
  budgets: z
    .object({
      id: z.number(),
      ficheId: z.number(),
      type: z.string(),
      unite: z.string(),
      annee: z.number().nullable().optional(),
      budgetPrevisionnel: z.string().nullable().optional(),
      budgetReel: z.string().nullable().optional(),
      estEtale: z.boolean().optional(),
    })
    .array()
    .nullable()
    .describe(`Budgets de la fiche action`),
  actionImpactId: z.number().nullish(),
  completion: completionSchema.describe('Données de completion de la fiche'),
});

export type FicheWithRelations = z.infer<typeof ficheWithRelationsSchema>;
export type Completion = z.infer<typeof completionSchema>;

export const ficheWithRelationsAndCollectiviteSchema =
  ficheWithRelationsSchema.extend({
    collectivite: collectiviteSchema
      .optional()
      .describe('Collectivité à laquelle la fiche est rattachée'),
  });
export type FicheWithRelationsAndCollectivite = z.infer<
  typeof ficheWithRelationsAndCollectiviteSchema
>;

export const ficheResumeSchema = ficheWithRelationsSchema
  .pick({
    id: true,
    collectiviteId: true,
    collectiviteNom: true,
    modifiedAt: true,
    titre: true,
    statut: true,
    ameliorationContinue: true,
    dateDebut: true,
    dateFin: true,
    priorite: true,
    restreint: true,
    pilotes: true,
    plans: true,
    axes: true,
    services: true,
    sharedWithCollectivites: true,
  })
  .extend({
    actionImpactId: z.number().nullish(),
  });

export type FicheResume = z.infer<typeof ficheResumeSchema>;
