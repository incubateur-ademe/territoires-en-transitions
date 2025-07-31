import classNames from 'classnames';

export const ModuleContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={classNames(
      'relative min-h-[21rem] flex flex-col gap-4 p-8 bg-white border border-grey-3 rounded-xl',
      className
    )}
  >
    {children}
  </div>
);
