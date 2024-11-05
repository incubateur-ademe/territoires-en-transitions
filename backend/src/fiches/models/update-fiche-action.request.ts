import z from 'zod';
import {
  createFicheActionSchema,
  FicheActionCiblesEnumType,
  ficheActionPiliersEciEnumType,
  ficheActionResultatsAttendusEnumType,
  ficheActionSchema,
  updateFicheActionSchema,
} from './fiche-action.table';
import { axeSchema } from './axe.table';
import { thematiqueSchema } from '../../taxonomie/models/thematique.table';
import { partenaireTagSchema } from '../../taxonomie/models/partenaire-tag.table';
import { structureTagSchema } from '../../taxonomie/models/structure-tag.table';
import { financeurTagSchema } from '../../taxonomie/models/financeur-tag.table';
import { serviceTagSchema } from '../../taxonomie/models/service-tag.table';
import { effetAttenduSchema } from '../../taxonomie/models/effet-attendu.table';
import { actionRelationSchema } from '../../referentiel/models/action-relation.table';
import { indicateurDefinitionSchema } from '../../indicateurs/models/indicateur-definition.table';
import { sousThematiqueSchema } from '../../taxonomie/models/sous-thematique.table';

// There is no proper Pilote or Referent tables, so we use a custom schema here
const piloteOrReferentSchema = z.object({
  nom: z.string(),
  collectivite_id: z.number(),
  tag_id: z.number(),
  user_id: z.string().uuid(),
});

// We're overriding piliersEci, resultatsAttendus and cibles because,
// for some unknown reason (a bug with zod/drizzle ?), extend() looses enum's array
export const updateFicheActionRequestSchema = updateFicheActionSchema.extend({
  piliersEci: z.nativeEnum(ficheActionPiliersEciEnumType).array().optional(),
  resultatsAttendus: z
    .nativeEnum(ficheActionResultatsAttendusEnumType)
    .array()
    .optional(),
  cibles: z.nativeEnum(FicheActionCiblesEnumType).array().optional(),
  axes: axeSchema.array().optional(),
  thematiques: thematiqueSchema.array().optional(),
  sousThematiques: sousThematiqueSchema.array().optional(),
  partenaires: partenaireTagSchema.array().optional(),
  structures: structureTagSchema.array().optional(),
  pilotes: piloteOrReferentSchema.array().optional(),
  referents: piloteOrReferentSchema.array().optional(),
  actions: actionRelationSchema.array().optional(),
  indicateurs: indicateurDefinitionSchema.array().optional(),
  services: serviceTagSchema.array().optional(),
  financeurs: financeurTagSchema.array().optional(),
  fichesLiees: ficheActionSchema.array().optional(),
  resultatAttendu: effetAttenduSchema.array().optional(),
});

export type UpdateFicheActionRequestType = z.infer<
  typeof updateFicheActionRequestSchema
>;

export type UpdateFicheActionType = z.infer<typeof updateFicheActionSchema>;
