import {
  indicateurAvecValeursParSourceSchema,
  IndicateurValeurTypeEnum,
  IndicateurValeurWithoutReferenceTypes,
  ORDERED_SEGMENTATIONS,
} from '@tet/domain/indicateurs';
import z from 'zod';

export const indicateurChartSegmentationSchema = z.object({
  type: z.enum(ORDERED_SEGMENTATIONS).optional(),
  source: z.string().optional(),
  valeurType: z
    .enum([
      IndicateurValeurTypeEnum.OBJECTIF,
      IndicateurValeurTypeEnum.RESULTAT,
    ])
    .optional(),
});
export type IndicateurChartSegmentation = z.infer<
  typeof indicateurChartSegmentationSchema
>;

export const indicateurChartSegmentationWithValeursSchema =
  indicateurChartSegmentationSchema.required().extend({
    indicateursEnfantValeurs: z
      .array(indicateurAvecValeursParSourceSchema)
      .optional(),
  });
export type IndicateurChartSegmentationWithValeurs = z.infer<
  typeof indicateurChartSegmentationWithValeursSchema
>;

export const indicateurChartSourceFilterSchema = z.array(
  z.object({
    sourceId: z.string(),
    valeurTypes: z
      .array(z.enum(IndicateurValeurWithoutReferenceTypes))
      .optional(),
  })
);
export type IndicateurChartSourceFilter = z.infer<
  typeof indicateurChartSourceFilterSchema
>;

export const indicateurChartInputSchema = z.object({
  collectiviteId: z.number(),
  indicateurId: z.number().optional(),
  sources: indicateurChartSourceFilterSchema.optional(),
  identifiantReferentiel: z.string().optional(),
  includeReferenceValeurs: z.boolean().optional(),
  includeMoyenne: z.boolean().optional(),
  includeSegmentation: indicateurChartSegmentationSchema.optional(),
});

export type IndicateurChartInput = z.infer<typeof indicateurChartInputSchema>;
