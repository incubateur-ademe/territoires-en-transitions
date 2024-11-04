import z from 'zod';
import {
  ficheActionSchema,
  updateFicheActionSchema,
} from './fiche-action.table';
import { axeSchema } from './axe.table';
import { thematiqueSchema } from 'backend/src/taxonomie/models/thematique.table';
import { partenaireTagSchema } from 'backend/src/taxonomie/models/partenaire-tag.table';
import { structureTagSchema } from 'backend/src/taxonomie/models/structure-tag.table';
import { financeurTagSchema } from 'backend/src/taxonomie/models/financeur-tag.table';
import { serviceTagSchema } from 'backend/src/taxonomie/models/service-tag.table';
import { effetAttenduSchema } from 'backend/src/taxonomie/models/effet-attendu.table';
import { actionRelationSchema } from 'backend/src/referentiel/models/action-relation.table';
import { indicateurDefinitionSchema } from 'backend/src/indicateurs/models/indicateur-definition.table';
import { sousThematiqueSchema } from 'backend/src/taxonomie/models/sous-thematique.table';

// There is no Pilote or Referent tables, so we use a custom schema here
const piloteOrReferentSchema = z.object({
  nom: z.string(),
  collectivite_id: z.number(),
  tag_id: z.number(),
  user_id: z.string().uuid(),
});

export const updateFicheActionRequestSchema = updateFicheActionSchema.extend({
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
