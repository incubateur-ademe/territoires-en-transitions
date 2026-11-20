import { appLabels } from '@/app/labels/catalog';
import { cn } from '@tet/ui/utils/cn';
import { PlanLevel, planLevelIndent, PlanLevelTag } from './plan-level.tag';

const LEVELS: PlanLevel[] = ['axe', 'sousAxe', 'action', 'sousAction'];

/** Le repère des quatre niveaux d'un plan, à côté du formulaire d'import. */
export const PlanLevelsGuide = ({ className }: { className?: string }) => (
  <aside
    aria-labelledby="plan-levels-guide-title"
    className={cn(
      'flex flex-col gap-4 rounded-lg border border-grey-3 bg-white p-6',
      className
    )}
    data-test="plans.import-ia.niveaux"
  >
    <div className="flex flex-col gap-1">
      <h3 id="plan-levels-guide-title" className="mb-0 text-lg text-primary-9">
        {appLabels.importPlanIaNiveauxTitre}
      </h3>
      <p className="mb-0 text-sm text-grey-7">
        {appLabels.importPlanIaNiveauxSousTitre}
      </p>
    </div>
    <ul className="flex flex-col gap-3 m-0 p-0 list-none">
      {LEVELS.map((level) => (
        <li
          key={level}
          className={cn(
            'flex flex-wrap items-baseline gap-x-3 gap-y-1 p-0',
            planLevelIndent[level]
          )}
        >
          <PlanLevelTag level={level} />
          <div className="flex flex-col min-w-0 flex-1 basis-48">
            <span className="text-sm text-grey-9">
              {appLabels.importPlanIaNiveaux[level].definition}
            </span>
            <span className="text-xs text-grey-7">
              {appLabels.importPlanIaNiveaux[level].exemple}
            </span>
          </div>
        </li>
      ))}
    </ul>
  </aside>
);
