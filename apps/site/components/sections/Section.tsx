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
    className={classNames('section fr-py-7w', containerClassName)}
  >
    <div className={classNames('fr-container flex flex-col gap-4', className)}>
      {children}
    </div>
  </section>
);

export default Section;
