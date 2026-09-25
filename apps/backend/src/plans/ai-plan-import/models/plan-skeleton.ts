import { z } from 'zod';

const skeletonEntrySchema = z.object({
  numero: z.string(),
  titre: z.string(),
});

/** Les axes et sous-axes d'un plan, sans ses actions. */
export const planSkeletonSchema = z.object({
  axes: z.array(
    skeletonEntrySchema.extend({ sousAxes: z.array(skeletonEntrySchema) })
  ),
});

export type PlanSkeleton = z.output<typeof planSkeletonSchema>;

/** Le squelette tel qu'un prompt le cite, ou son absence. */
export const renderSkeleton = (skeleton: PlanSkeleton | null): string => {
  if (skeleton === null || skeleton.axes.length === 0) {
    return 'Aucun squelette connu : déduisez les axes et sous-axes du texte.';
  }
  return skeleton.axes
    .flatMap((axe) => [
      `Axe ${axe.numero} : ${axe.titre}`,
      ...axe.sousAxes.map((sousAxe) => `  ${sousAxe.numero} ${sousAxe.titre}`),
    ])
    .join('\n');
};
