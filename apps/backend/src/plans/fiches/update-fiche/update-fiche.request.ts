import { collectiviteSchema } from '@/backend/collectivites/shared/models/collectivite.table';
import { financeurTagSchema } from '@/backend/collectivites/tags/financeur-tag.table';
import { libreTagSchema } from '@/backend/collectivites/tags/libre-tag.table';
import { partenaireTagSchema } from '@/backend/collectivites/tags/partenaire-tag.table';
import { serviceTagSchema } from '@/backend/collectivites/tags/service-tag.table';
import { structureTagSchema } from '@/backend/collectivites/tags/structure-tag.table';
import { indicateurDefinitionSchema } from '@/backend/indicateurs/definitions/indicateur-definition.table';
import { actionRelationSchema } from '@/backend/referentiels/models/action-relation.table';
import { effetAttenduSchema } from '@/backend/shared/effet-attendu/effet-attendu.table';
import { tempsDeMiseEnOeuvreSchema } from '@/backend/shared/models/temps-de-mise-en-oeuvre.table';
import { sousThematiqueSchema } from '@/backend/shared/thematiques/sous-thematique.table';
import { thematiqueSchema } from '@/backend/shared/thematiques/thematique.table';
import z from 'zod';
import { axeSchema } from '../shared/models/axe.table';
import {
  ficheSchema,
  ficheSchemaUpdate,
} from '../shared/models/fiche-action.table';

// There is no proper Pilote or Referent tables, so we use a custom schema here
export const personneSchema = z.object({
  tagId: z.number().nullish(),
  userId: z.string().uuid().nullish(),
});

const financeurSchema = financeurTagSchema.pick({ id: true }).extend({
  id: financeurTagSchema.shape.id,
});

const financeurWithMontantSchema = z.object({
  financeurTag: financeurSchema.nullish(),
  montantTtc: z.number().nullish(),
});

export const updateFicheRequestSchema = ficheSchemaUpdate.extend({
  budgetPrevisionnel: z
    .string()
    .transform((val) => val.toString())
    .refine((val) => !isNaN(Number(val)), {
      message: "Expected 'budgetPrevisionnel' to be a numeric string",
    })
    .nullish(),
  dateDebut: z
    .string()
    .nullable()
    .refine((val) => val === null || !isNaN(Date.parse(val)), {
      message: "Invalid date format for 'dateDebut'",
    })
    .nullish(),

  tempsDeMiseEnOeuvre: tempsDeMiseEnOeuvreSchema.pick({ id: true }).nullish(),
  axes: axeSchema.pick({ id: true }).array().nullish(),
  thematiques: thematiqueSchema.pick({ id: true }).array().nullish(),
  sousThematiques: sousThematiqueSchema.pick({ id: true }).array().nullish(),
  partenaires: partenaireTagSchema.pick({ id: true }).array().nullish(),
  structures: structureTagSchema.pick({ id: true }).array().nullish(),
  pilotes: personneSchema.array().nullish(),
  referents: personneSchema.array().nullish(),
  sharedWithCollectivites: collectiviteSchema
    .pick({ id: true })
    .array()
    .nullish(),
  mesures: actionRelationSchema.pick({ id: true }).array().nullish(),
  indicateurs: indicateurDefinitionSchema.pick({ id: true }).array().nullish(),
  services: serviceTagSchema.pick({ id: true }).array().nullish(),
  financeurs: financeurWithMontantSchema.array().nullish(),
  fichesLiees: ficheSchema.pick({ id: true }).array().nullish(),
  effetsAttendus: effetAttenduSchema.pick({ id: true }).array().nullish(),
  libreTags: libreTagSchema.pick({ id: true }).array().nullish(),
});

export type UpdateFicheRequest = z.infer<typeof updateFicheRequestSchema>;
