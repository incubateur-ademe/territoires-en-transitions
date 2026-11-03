import * as z from 'zod/mini';
import { personneTagOrUserSchema } from '../../collectivites/personne-tag-or-user.schema';
import { tagSchema } from '../../collectivites/tag.base.schema';
import { authorSchema } from '../../users/author.schema';
import { indicateurCollectiviteSchema } from '../shared/indicateur-collectivite.schema';
import { indicateurPredefiniNatureSchema } from './indicateur-nature.schema';
import {
  indicateurCommonSchema,
  indicateurPersoSchema,
  indicateurPredefiniSchema,
} from './indicateur.schema';

const indicateurEnfantSchema = z.object({
  id: indicateurCommonSchema.shape.id,
  identifiantReferentiel: z.nullable(
    indicateurPredefiniNatureSchema.shape.identifiantReferentiel
  ),
  titre: indicateurCommonSchema.shape.titre,
  titreCourt: indicateurCommonSchema.shape.titreCourt,
});

const indicateurParentSchema = z.object({
  ...indicateurEnfantSchema.shape,
  parent: z.nullable(indicateurEnfantSchema),
});

const indicateurSuiviCollectiviteSchema = z.object({
  commentaire: z.nullable(z.string()),
  estConfidentiel: z.nullable(z.boolean()),
  estFavori: z.nullable(z.boolean()),
  isApplicable: z.boolean(),
  isSuivi: z.boolean(),
  categories: z.array(tagSchema),
  pilotes: z.array(personneTagOrUserSchema),
  services: z.array(tagSchema),
  modifiedBy: z.nullable(authorSchema),
  modifiedAt: indicateurCollectiviteSchema.shape.modifiedAt,
});

const indicateurRelationsSchema = z.object({
  thematiques: z.array(tagSchema),
  enfants: z.array(indicateurEnfantSchema),
  parent: z.nullable(indicateurParentSchema),
  fiches: z.array(z.object({ id: z.number(), titre: z.string() })),
  mesures: z.array(z.object({ id: z.string(), nom: z.string() })),
  groupementCollectivites: z.array(
    z.object({ id: z.number(), nom: z.string() })
  ),
});

const detailedFieldsShape = {
  ...indicateurSuiviCollectiviteSchema.shape,
  ...indicateurRelationsSchema.shape,
  hasOpenData: z.boolean(),
  estAgregation: z.boolean(),
  estRempli: z.boolean(),
};

const indicateurPersoDetailleSchema = z.extend(
  indicateurPersoSchema,
  detailedFieldsShape
);

const indicateurPredefiniDetailleSchema = z.extend(
  indicateurPredefiniSchema,
  detailedFieldsShape
);

export const indicateurDetailleSchema = z.union([
  indicateurPersoDetailleSchema,
  indicateurPredefiniDetailleSchema,
]);

type IndicateurPersoDetaille = z.infer<typeof indicateurPersoDetailleSchema>;
type IndicateurPredefiniDetaille = z.infer<
  typeof indicateurPredefiniDetailleSchema
>;
export type IndicateurDetaille =
  | IndicateurPersoDetaille
  | IndicateurPredefiniDetaille;
