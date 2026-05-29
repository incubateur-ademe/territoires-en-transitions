import { PropsWithChildren, ReactNode } from 'react';

type Props = PropsWithChildren<{
  title?: string;
  description?: string;
  action?: ReactNode;
}>;

export const DemarchePcaetSection = ({
  title,
  description,
  action,
  children,
}: Props) => {
  return (
    <section className="rounded-lg border border-grey-3 bg-white p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {title ? (
            <h2 className="text-lg font-bold text-primary-9">{title}</h2>
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
