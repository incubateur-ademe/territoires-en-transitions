import * as z from 'zod/mini';

export const reponseBinaireValueSchema = z.nullable(z.boolean());

export const reponseProportionValueSchema = z.nullable(
  z.number().check(z.minimum(0), z.maximum(1))
);

export const reponseChoixValueSchema = z.nullable(z.string());

/** Union des valeurs possibles quand le type de question n'est pas connu (ex. input API) */
export const reponseValueSchema = z.union([
  reponseBinaireValueSchema,
  reponseProportionValueSchema,
  reponseChoixValueSchema,
]);

export type PersonnalisationReponseValue = z.infer<typeof reponseValueSchema>;

const personnalisationReponseBinaireSchema = z.object({
  questionId: z.string(),
  questionType: z.literal('binaire'),
  reponse: reponseBinaireValueSchema,
  justification: z.nullable(z.string()),
});

const personnalisationReponseProportionSchema = z.object({
  questionId: z.string(),
  questionType: z.literal('proportion'),
  reponse: reponseProportionValueSchema,
  justification: z.nullable(z.string()),
});

const personnalisationReponseChoixSchema = z.object({
  questionId: z.string(),
  questionType: z.literal('choix'),
  reponse: reponseChoixValueSchema,
  justification: z.nullable(z.string()),
});

export const personnalisationReponseSchema = z.discriminatedUnion(
  'questionType',
  [
    personnalisationReponseBinaireSchema,
    personnalisationReponseProportionSchema,
    personnalisationReponseChoixSchema,
  ]
);

export type PersonnalisationReponse = z.infer<
  typeof personnalisationReponseSchema
>;

/** questionType et reponse liés (ex. retour repository après écriture) */
export type PersonnalisationReponseTypee = Pick<
  PersonnalisationReponse,
  'questionType' | 'reponse'
>;
