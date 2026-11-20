import { appLabels } from '@/app/labels/catalog';
import { capitalize } from '@tet/ui/labels/plural';
import { cn } from '@tet/ui/utils/cn';

export type PlanLevel = 'axe' | 'sousAxe' | 'action' | 'sousAction';

const levelClassNames: Record<PlanLevel, string> = {
  axe: 'border-primary-10 bg-primary-10 text-white',
  sousAxe: 'border-primary-3 bg-primary-3 text-primary-10',
  action: 'border-primary-8 bg-primary-8 text-white',
  sousAction: 'border-primary-8 bg-white text-primary-9',
};

/** Indentation de chaque niveau, du plus large au plus précis. */
export const planLevelIndent: Record<PlanLevel, string> = {
  axe: '',
  sousAxe: 'pl-5',
  action: 'pl-10',
  sousAction: 'pl-[3.75rem]',
};

export const planLevelLabel = (level: PlanLevel): string =>
  capitalize(appLabels[level]());

/** L'étiquette d'un niveau du plan, la même dans le repère et dans la question. */
export const PlanLevelTag = ({ level }: { level: PlanLevel }) => (
  <span
    className={cn(
      'inline-block shrink-0 w-28 rounded border px-2 py-0.5 text-center text-sm font-bold',
      levelClassNames[level]
    )}
  >
    {planLevelLabel(level)}
  </span>
);
