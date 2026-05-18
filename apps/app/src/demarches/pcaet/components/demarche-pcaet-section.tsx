import { appLabels } from '@/app/labels/catalog';
import { Badge, cn } from '@tet/ui';
import { PropsWithChildren, ReactNode } from 'react';

type Props = PropsWithChildren<{
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  status?: 'complete' | 'incomplete';
}>;

export const DemarchePcaetSection = ({
  title,
  description,
  action,
  className,
  status,
  children,
}: Props) => {
  return (
    <section
      className={cn(
        'rounded-lg border border-grey-3 bg-white p-6 flex flex-col gap-4',
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {title ? (
              <h2 className="text-lg font-bold text-primary-9 m-0">{title}</h2>
            ) : null}
            {status ? (
              <Badge
                title={
                  status === 'complete'
                    ? appLabels.demarchePcaetSectionComplete
                    : appLabels.demarchePcaetSectionIncomplete
                }
                variant={status === 'complete' ? 'success' : 'warning'}
                size="sm"
                icon={status === 'complete' ? 'check-line' : 'time-line'}
              />
            ) : null}
          </div>
          {description ? (
            <p className="text-sm text-grey-7 mt-1">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
};
