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

const personnalisationReponseBaseSchema = z.object({
  questionId: z.string(),
  justification: z.nullable(z.string()),
  competenceCode: z.nullable(z.string()),
  competenceIntitule: z.nullable(z.string()),
  competenceExercee: z.nullable(z.boolean()),
  natureTransfert: z.nullable(z.string()),
});

const personnalisationReponseBinaireSchema = z.extend(
  personnalisationReponseBaseSchema,
  {
    questionType: z.literal('binaire'),
    reponse: reponseBinaireValueSchema,
  }
);

const personnalisationReponseProportionSchema = z.extend(
  personnalisationReponseBaseSchema,
  {
    questionType: z.literal('proportion'),
    reponse: reponseProportionValueSchema,
  }
);

const personnalisationReponseChoixSchema = z.extend(
  personnalisationReponseBaseSchema,
  {
    questionType: z.literal('choix'),
    reponse: reponseChoixValueSchema,
  }
);

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
