import classNames from 'classnames';

type SectionProps = {
  id?: string;
  children: React.ReactNode;
  containerClassName?: string;
  className?: string;
};

const Section = ({
  id,
  children,
  containerClassName = '',
  className = '',
}: SectionProps): JSX.Element => (
  <section
    id={id}
    className={classNames('container section py-7 px-4', containerClassName)}
  >
    <div
      className={classNames(
        'container w-full mx-auto px-4 flex flex-col gap-4',
        className
      )}
    >
      {children}
    </div>
  </section>
);

export default Section;
