import classNames from 'classnames';

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
};

const Section = ({children, className, containerClassName}: SectionProps) => {
  return (
    <div
      className={classNames('w-full px-4 lg:px-6 xl:px-2', containerClassName)}
    >
      <div
        className={classNames(
          'grow flex flex-col w-full mx-auto xl:max-w-7xl',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default Section;
