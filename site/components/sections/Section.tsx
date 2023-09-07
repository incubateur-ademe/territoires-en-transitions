import classNames from 'classnames';

type SectionProps = {
  id?: string;
  children: React.ReactNode;
  containerClassName?: string;
  className?: string;
  customBackground?: string;
};

const Section = ({
  id,
  children,
  containerClassName = '',
  className = '',
  customBackground,
}: SectionProps): JSX.Element => (
  <section
    id={id}
    className={classNames('section fr-py-7w', containerClassName)}
    style={{backgroundColor: customBackground}}
  >
    <div className={classNames('fr-container flex gap-4', className)}>
      {children}
    </div>
  </section>
);

export default Section;
