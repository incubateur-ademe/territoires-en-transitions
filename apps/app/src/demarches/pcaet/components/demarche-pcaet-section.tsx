import { cn, Icon } from '@tet/ui';
import { PropsWithChildren, ReactNode } from 'react';

type Props = PropsWithChildren<{
  title?: string;
  description?: string;
  action?: ReactNode;
  status?: 'complete' | 'incomplete';
  className?: string;
}>;

export const DemarchePcaetSection = ({
  title,
  description,
  action,
  status,
  className,
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
          {title ? (
            <div className="flex items-center gap-2">
              {status && (
                <Icon
                  icon={
                    status === 'complete'
                      ? 'checkbox-circle-fill'
                      : 'error-warning-fill'
                  }
                  className={
                    status === 'complete' ? 'text-success' : 'text-warning-1'
                  }
                  size="lg"
                />
              )}
              <h2 className="text-lg font-bold text-primary-9">{title}</h2>
            </div>
          ) : null}
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
