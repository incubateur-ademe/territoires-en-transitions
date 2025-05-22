import classNames from 'classnames';

const ModuleContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={classNames(
      'col-span-full min-h-[21rem] flex flex-col gap-4 p-8 bg-white border border-primary-4 rounded-xl',
      className
    )}
  >
    {children}
  </div>
);

export default ModuleContainer;
