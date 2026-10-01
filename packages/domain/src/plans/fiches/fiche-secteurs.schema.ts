import * as z from 'zod/mini';
import { createEnumObject } from '../../utils/enum.utils';
import { secteurReglementaireEnumSchema } from './secteur-reglementaire.enum.schema';

export const origineSecteursEnumValues = [
  'automatique',
  'manuelle',
  // fiche inconnue de Communs (404)
  'indisponible',
] as const;

export const OrigineSecteursEnum = createEnumObject(origineSecteursEnumValues);

export type OrigineSecteurs = (typeof origineSecteursEnumValues)[number];

const repartitionSecteursCommunsSchema = z.object({
  dominant: z.nullable(z.string()),
  nonAttribuable: z.number(),
  // les parts absentes valent 0 ; un code de secteur inconnu est ignoré
  parts: z.record(z.string(), z.number()),
});

export type RepartitionSecteursCommuns = z.infer<
  typeof repartitionSecteursCommunsSchema
>;

export const reponseSecteursCommunsSchema = z.object({
  id: z.string(),
  secteursDirect: z.nullable(repartitionSecteursCommunsSchema),
  secteursContribution: z.nullable(repartitionSecteursCommunsSchema),
  methode: z.string(),
});

export type ReponseSecteursCommuns = z.infer<
  typeof reponseSecteursCommunsSchema
>;

const origineSecteursConnusSchema = z.enum([
  OrigineSecteursEnum.AUTOMATIQUE,
  OrigineSecteursEnum.MANUELLE,
]);

export const ficheSecteursSchema = z.discriminatedUnion('etat', [
  z.object({
    etat: z.literal('attribue'),
    secteurs: z.array(secteurReglementaireEnumSchema),
    origine: origineSecteursConnusSchema,
  }),
  z.object({
    etat: z.literal('non_attribuable'),
    origine: origineSecteursConnusSchema,
  }),
  // Communs n'a pas encore classé la fiche, ou n'a pas répondu
  z.object({ etat: z.literal('en_cours_de_calcul') }),
  // fiche inconnue de Communs (404)
  z.object({ etat: z.literal('a_renseigner') }),
  // fiche hors PCAET
  z.object({ etat: z.literal('non_renseigne') }),
]);

export type FicheSecteurs = z.infer<typeof ficheSecteursSchema>;
