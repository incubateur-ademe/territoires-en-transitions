import { z } from 'zod';

export const planRecapSchema = z.object({
  axesCount: z.number(),
  sousAxesCount: z.number(),
  fichesCount: z.number(),
});

export type PlanRecap = z.infer<typeof planRecapSchema>;

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count > 1 ? plural : singular}`;

/** « 5 axes, 11 sous-axes, 224 actions et sous-actions », sans les zéros. */
export const formatPlanRecap = ({
  axesCount,
  sousAxesCount,
  fichesCount,
}: PlanRecap): string =>
  [
    axesCount > 0 && pluralize(axesCount, 'axe', 'axes'),
    sousAxesCount > 0 && pluralize(sousAxesCount, 'sous-axe', 'sous-axes'),
    fichesCount > 0 &&
      pluralize(fichesCount, 'action', 'actions et sous-actions'),
  ]
    .filter(Boolean)
    .join(', ');
